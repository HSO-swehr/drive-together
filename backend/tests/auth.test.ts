import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { AuthRegisterResponse } from 'shared';
import { authRoutes } from '../src/routes/auth.js';
import { initDb, closeDb, getDb } from '../src/db.js';

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
    expect((res.json() as AuthRegisterResponse).success).toBe(true);

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
    expect((res.json() as AuthRegisterResponse).success).toBe(false);
  });

  // --- Password validation --------------------------------------------------

  it('rejects a too-short password (400)', async () => {
    const res = await register({ email: 'shortpw@example.com', password: 'ab' });
    expect(res.statusCode).toBe(400);
    expect((res.json() as AuthRegisterResponse).success).toBe(false);
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
    expect((res.json() as AuthRegisterResponse).success).toBe(false);
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
