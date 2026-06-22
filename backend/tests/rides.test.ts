import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import type { RideCreateResponse, RidesListResponse } from 'shared';
import { ridesRoutes } from '../src/routes/rides.js';
import { initDb, closeDb, getDb, createUser, createSession } from '../src/db.js';

describe('Rides routes', () => {
  let app: FastifyInstance;
  let userId: number;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    initDb();
    app = Fastify();
    await app.register(ridesRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    closeDb();
  });

  beforeEach(() => {
    // Fresh user + session and an empty rides table for each test, so that the
    // ownership / listing assertions don't depend on test ordering.
    getDb().exec('DELETE FROM rides');
    getDb().exec('DELETE FROM sessions');
    getDb().exec('DELETE FROM users');
    userId = createUser('driver@example.com', 'hashed');
    sessionCookie = `session=${createSession(userId)}`;
  });

  // A departure time safely in the future, in the ISO 8601 shape the API expects.
  const futureTime = (offsetMs = 86_400_000): string =>
    new Date(Date.now() + offsetMs).toISOString();

  const validBody = (overrides: Record<string, unknown> = {}) => ({
    departure: 'Berlin',
    destination: 'München',
    departure_time: futureTime(),
    available_seats: 3,
    ...overrides,
  });

  const postRide = (body: Record<string, unknown>, cookie?: string) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (cookie) headers.cookie = cookie;
    return app.inject({ method: 'POST', url: '/api/rides', headers, payload: body });
  };

  const getMyRides = (cookie?: string) => {
    const headers: Record<string, string> = {};
    if (cookie) headers.cookie = cookie;
    return app.inject({ method: 'GET', url: '/api/rides/my-rides', headers });
  };

  // --- POST /api/rides: authentication -------------------------------------

  describe('POST /api/rides — authentication', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const res = await postRide(validBody());
      expect(res.statusCode).toBe(401);
      expect((res.json() as RideCreateResponse).success).toBe(false);
      // No ride must be written when the caller is not authenticated.
      expect(getDb().prepare('SELECT COUNT(*) AS n FROM rides').get()).toEqual({ n: 0 });
    });

    it('rejects an unknown session cookie with 401', async () => {
      const res = await postRide(validBody(), 'session=does-not-exist');
      expect(res.statusCode).toBe(401);
      expect((res.json() as RideCreateResponse).success).toBe(false);
    });
  });

  // --- POST /api/rides: input validation -----------------------------------

  describe('POST /api/rides — validation', () => {
    it('rejects a missing field with 400 and names the field', async () => {
      const { destination, ...withoutDestination } = validBody();
      void destination;
      const res = await postRide(withoutDestination, sessionCookie);
      expect(res.statusCode).toBe(400);
      const body = res.json() as RideCreateResponse;
      expect(body.success).toBe(false);
      // The message must point at the actual failure, not a blanket text.
      if (!body.success) expect(body.error).toMatch(/Ziel-Ort/);
    });

    it('rejects available_seats <= 0 with 400', async () => {
      const res = await postRide(validBody({ available_seats: 0 }), sessionCookie);
      expect(res.statusCode).toBe(400);
    });

    it('rejects available_seats above the allowed maximum with 400 and a seat-specific message', async () => {
      const res = await postRide(validBody({ available_seats: 99 }), sessionCookie);
      expect(res.statusCode).toBe(400);
      const body = res.json() as RideCreateResponse;
      expect(body.success).toBe(false);
      if (!body.success) expect(body.error).toMatch(/Sitzplätze/);
    });

    it('rejects a departure time in the past with 400', async () => {
      const res = await postRide(
        validBody({ departure_time: new Date(Date.now() - 86_400_000).toISOString() }),
        sessionCookie
      );
      expect(res.statusCode).toBe(400);
      const body = res.json() as RideCreateResponse;
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error).toMatch(/Zukunft/);
      }
      // The past-time rejection must not have persisted a ride.
      expect(getDb().prepare('SELECT COUNT(*) AS n FROM rides').get()).toEqual({ n: 0 });
    });
  });

  // --- POST /api/rides: happy path -----------------------------------------

  describe('POST /api/rides — success', () => {
    it('creates a ride: 201, echoes the input, assigns server fields', async () => {
      const departure_time = futureTime();
      const res = await postRide(
        validBody({
          departure: 'Hamburg',
          destination: 'Köln',
          departure_time,
          available_seats: 2,
        }),
        sessionCookie
      );

      expect(res.statusCode).toBe(201);
      const body = res.json() as RideCreateResponse;
      expect(body.success).toBe(true);
      if (!body.success) return;

      expect(body.data.id).toBeGreaterThan(0);
      expect(body.data.departure).toBe('Hamburg');
      expect(body.data.destination).toBe('Köln');
      expect(body.data.departure_time).toBe(departure_time);
      expect(body.data.available_seats).toBe(2);
      expect(body.data.created_at).toBeDefined();
    });

    it('takes the owner from the session, ignoring any user_id in the body', async () => {
      // Body tries to spoof a different owner. Fastify strips unknown properties
      // (default removeAdditional), so the user_id never reaches the handler and
      // the owner is always the session user — the client cannot forge it.
      const other = createUser('victim@example.com', 'hashed');
      const res = await postRide(validBody({ user_id: other }), sessionCookie);
      expect(res.statusCode).toBe(201);
      const body = res.json() as RideCreateResponse;
      if (!body.success) throw new Error('expected success');
      expect(body.data.user_id).toBe(userId);
      expect(body.data.user_id).not.toBe(other);
    });
  });

  // --- GET /api/rides/my-rides ---------------------------------------------

  describe('GET /api/rides/my-rides', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const res = await getMyRides();
      expect(res.statusCode).toBe(401);
      expect((res.json() as RidesListResponse).success).toBe(false);
    });

    it('returns only the caller’s own rides, sorted by departure_time', async () => {
      const other = createUser('other@example.com', 'hashed');

      // Caller's rides, inserted out of order.
      await postRide(
        validBody({ departure: 'B', departure_time: futureTime(2 * 86_400_000) }),
        sessionCookie
      );
      await postRide(
        validBody({ departure: 'A', departure_time: futureTime(1 * 86_400_000) }),
        sessionCookie
      );
      // A ride owned by someone else must not leak into the caller's list.
      await postRide(validBody({ departure: 'Foreign' }), `session=${createSession(other)}`);

      const res = await getMyRides(sessionCookie);
      expect(res.statusCode).toBe(200);
      const body = res.json() as RidesListResponse;
      expect(body.success).toBe(true);
      if (!body.success) return;

      expect(body.data).toHaveLength(2);
      expect(body.data.every((r) => r.user_id === userId)).toBe(true);
      expect(body.data.map((r) => r.departure)).toEqual(['A', 'B']);
    });

    it('returns an empty list for a user with no rides', async () => {
      const res = await getMyRides(sessionCookie);
      expect(res.statusCode).toBe(200);
      const body = res.json() as RidesListResponse;
      expect(body.success).toBe(true);
      if (!body.success) return;
      expect(body.data).toEqual([]);
    });
  });
});
