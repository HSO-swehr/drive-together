import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { AuthResponse, AuthMeResponse } from 'shared';
import { authRoutes } from '../src/routes/auth.js';
import { initDb, closeDb, getDb, getSessionUser } from '../src/db.js';

describe('POST /api/auth/register', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    initDb();
    app = Fastify();
    await app.register(authRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    closeDb();
  });

  const register = (payload: Record<string, unknown>) =>
    app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload,
    });

  // --- Integration: happy path ---------------------------------------------

  it('registers a new user: 201, success body, no auto-login', async () => {
    const res = await register({ email: 'new@example.com', password: 'secret' });
    expect(res.statusCode).toBe(201);
    expect((res.json() as AuthResponse).success).toBe(true);

    // Registration does not log the user in yet (that is Story 2) — so it must
    // not hand out a session cookie.
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  // --- bcrypt hashing -------------------------------------------------------

  it('stores the password as a bcrypt hash, never as plaintext', async () => {
    const password = 'topsecret';
    await register({ email: 'hash@example.com', password });

    const row = getDb()
      .prepare('SELECT password_hash FROM users WHERE email = ?')
      .get('hash@example.com') as { password_hash: string };

    expect(row.password_hash).not.toBe(password);
    expect(row.password_hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    expect(await bcrypt.compare(password, row.password_hash)).toBe(true);
  });

  // --- Integration: duplicate email ----------------------------------------

  it('rejects a duplicate email (409), case-insensitively', async () => {
    await register({ email: 'dup@example.com', password: 'secret' });
    const res = await register({ email: 'DUP@Example.com', password: 'secret' });

    expect(res.statusCode).toBe(409);
    expect((res.json() as AuthResponse).success).toBe(false);
  });

  // --- Password validation --------------------------------------------------

  it('rejects a too-short password (400)', async () => {
    const res = await register({ email: 'shortpw@example.com', password: 'ab' });
    expect(res.statusCode).toBe(400);
    expect((res.json() as AuthResponse).success).toBe(false);
  });

  it('rejects an over-long password (400)', async () => {
    // Longer than bcrypt's 72-byte limit, which the schema rejects up front.
    const res = await register({ email: 'longpw@example.com', password: 'a'.repeat(73) });
    expect(res.statusCode).toBe(400);
  });

  // --- Email validation -----------------------------------------------------

  it('rejects a malformed email (400)', async () => {
    const res = await register({ email: 'not-an-email', password: 'secret' });
    expect(res.statusCode).toBe(400);
    expect((res.json() as AuthResponse).success).toBe(false);
  });

  it('rejects an over-long email (400)', async () => {
    const longEmail = `${'a'.repeat(95)}@example.com`; // > 100 characters
    const res = await register({ email: longEmail, password: 'secret' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a missing field (400)', async () => {
    const res = await register({ email: 'nopassword@example.com' });
    expect(res.statusCode).toBe(400);
  });

  // --- Email normalization --------------------------------------------------

  it('rejects a whitespace-padded email at the API edge (400)', async () => {
    // The schema pattern forbids whitespace, so padded input never reaches the
    // handler. (Case/whitespace normalization itself is covered in db.test.ts.)
    const res = await register({ email: '  padded@example.com  ', password: 'secret' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    initDb();
    app = Fastify();
    await app.register(authRoutes);
    await app.ready();

    // A single known account for the login cases below.
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'member@example.com', password: 'correct horse' },
    });
  });

  afterAll(async () => {
    await app.close();
    closeDb();
  });

  const login = (payload: Record<string, unknown>) =>
    app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload,
    });

  it('logs a registered user in: 200 + session cookie that maps to the user', async () => {
    const res = await login({ email: 'member@example.com', password: 'correct horse' });
    expect(res.statusCode).toBe(200);
    expect((res.json() as AuthResponse).success).toBe(true);

    const cookie = res.headers['set-cookie'];
    expect(cookie).toContain('session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');

    const sessionId = /session=([^;]+)/.exec(
      Array.isArray(cookie) ? cookie.join(';') : (cookie ?? '')
    )?.[1];
    expect(getSessionUser(sessionId ?? '')).not.toBeNull();
  });

  it('accepts the email case-insensitively', async () => {
    const res = await login({ email: 'MEMBER@Example.com', password: 'correct horse' });
    expect(res.statusCode).toBe(200);
  });

  it('rejects a wrong password (401, no cookie)', async () => {
    const res = await login({ email: 'member@example.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect((res.json() as AuthResponse).success).toBe(false);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects an unknown email with the same response as a wrong password', async () => {
    const wrongPw = await login({ email: 'member@example.com', password: 'wrong' });
    const unknown = await login({ email: 'nobody@example.com', password: 'whatever' });

    // Identical status and body, so the response does not reveal whether the
    // email is registered (no user enumeration).
    expect(unknown.statusCode).toBe(401);
    expect(unknown.json()).toEqual(wrongPw.json());
  });

  it('rejects a missing field (400)', async () => {
    const res = await login({ email: 'member@example.com' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let app: FastifyInstance;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    initDb();
    app = Fastify();
    await app.register(authRoutes);
    await app.ready();

    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'member@example.com', password: 'correct horse' },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'member@example.com', password: 'correct horse' },
    });
    const setCookie = loginRes.headers['set-cookie'];
    // Re-send only the name=value pair (drop the attributes) as a Cookie header.
    sessionCookie = /session=[^;]+/.exec(
      Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '')
    )![0];
  });

  afterAll(async () => {
    await app.close();
    closeDb();
  });

  const me = (headers: Record<string, string> = {}) =>
    app.inject({ method: 'GET', url: '/api/auth/me', headers });

  it('reports authenticated for a valid session cookie', async () => {
    const res = await me({ cookie: sessionCookie });
    expect(res.statusCode).toBe(200);
    expect((res.json() as AuthMeResponse).authenticated).toBe(true);
  });

  it('reports not authenticated without a cookie', async () => {
    const res = await me();
    expect(res.statusCode).toBe(200);
    expect((res.json() as AuthMeResponse).authenticated).toBe(false);
  });

  it('reports not authenticated for an unknown session id', async () => {
    const res = await me({ cookie: 'session=does-not-exist' });
    expect((res.json() as AuthMeResponse).authenticated).toBe(false);
  });
});
