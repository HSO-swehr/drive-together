import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { AuthRegisterResponse } from 'shared';
import { authRoutes } from '../src/routes/auth.js';
import { initDb, closeDb, getDb, getSessionUser, createSession, userExists } from '../src/db.js';

/** Pull the session id out of a `Set-Cookie` header value. */
function sessionIdFromCookie(cookie: string | string[] | undefined): string {
  const value = Array.isArray(cookie) ? cookie.join(';') : (cookie ?? '');
  const match = /session=([^;]+)/.exec(value);
  return match?.[1] ?? '';
}

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

  it('registers a new user: 201, session cookie, no sessionId in body', async () => {
    const res = await register({ email: 'new@example.com', password: 'secret' });
    expect(res.statusCode).toBe(201);

    const body = res.json() as AuthRegisterResponse;
    expect(body.success).toBe(true);
    // The session id must never leak into the response body — cookie only.
    expect(body).not.toHaveProperty('sessionId');

    const cookie = res.headers['set-cookie'];
    expect(cookie).toContain('session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');

    // The cookie's session is persisted and maps back to a real user.
    const sessionId = sessionIdFromCookie(cookie);
    expect(sessionId).not.toBe('');
    expect(getSessionUser(sessionId)).not.toBeNull();
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
    // handler — it is rejected before normalization rather than trimmed.
    const res = await register({ email: '  padded@example.com  ', password: 'secret' });
    expect(res.statusCode).toBe(400);
  });

  it('normalizeEmail collapses case and whitespace at the helper level', async () => {
    await register({ email: 'norm@example.com', password: 'secret' });
    // Direct helper call bypasses the schema: trim + lowercase both apply, so a
    // differently-cased / padded address resolves to the same stored user.
    expect(userExists('  NORM@Example.com  ')).toBe(true);
  });
});

// --- DB helpers (unit) ------------------------------------------------------

describe('session helpers', () => {
  beforeAll(() => {
    process.env.DATABASE_PATH = ':memory:';
    initDb();
  });

  afterAll(() => {
    closeDb();
  });

  it('getSessionUser returns null for an unknown session id', () => {
    expect(getSessionUser('does-not-exist')).toBeNull();
  });

  it('createSession rejects a non-existent user_id (foreign key enforced)', () => {
    // Fails only if PRAGMA foreign_keys = ON is actually set.
    expect(() => createSession(999_999)).toThrow();
  });
});
