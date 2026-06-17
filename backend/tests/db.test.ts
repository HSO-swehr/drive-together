import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initDb,
  getDb,
  closeDb,
  createUser,
  getUserByEmail,
  createSession,
  getSessionUser,
} from '../src/db.js';

describe('Database', () => {
  beforeAll(() => {
    // Set test database path
    process.env.DATABASE_PATH = ':memory:';
    initDb();
  });

  afterAll(() => {
    closeDb();
  });

  it('should initialize database successfully', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });

  it('should have created required tables', () => {
    const db = getDb();

    const tableNames = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>;

    const tables = tableNames.map((t) => t.name);

    expect(tables).toContain('users');
    expect(tables).toContain('sessions');
  });

  describe('User Operations', () => {
    it('should create a user and return user id', () => {
      const userId = createUser('test@example.com', 'hashed_password');
      expect(userId).toBeGreaterThan(0);
    });

    it('should throw error when creating user with duplicate email', () => {
      createUser('duplicate@example.com', 'password1');

      expect(() => {
        createUser('duplicate@example.com', 'password2');
      }).toThrow();
    });

    it('should treat emails case- and whitespace-insensitively', () => {
      const userId = createUser('  Normalized@Example.com ', 'hashed_password');

      // Lookup with a differently-cased / padded variant finds the same user
      expect(getUserByEmail('normalized@example.com')?.id).toBe(userId);
      expect(getUserByEmail('NORMALIZED@EXAMPLE.COM')?.id).toBe(userId);

      // A variant that only differs in case/whitespace is a duplicate
      expect(() => {
        createUser('normalized@example.com', 'password2');
      }).toThrow();
    });

    it('getUserByEmail returns id + hash for an existing user, case-insensitively', () => {
      const userId = createUser('lookup@example.com', 'the_hash');

      const found = getUserByEmail('LOOKUP@Example.com');
      expect(found).toEqual({ id: userId, password_hash: 'the_hash' });
    });

    it('getUserByEmail returns undefined for an unknown user', () => {
      expect(getUserByEmail('missing@example.com')).toBeUndefined();
    });
  });

  describe('Session Operations', () => {
    it('creates a session that maps back to its user', () => {
      const userId = createUser('session@example.com', 'hashed_password');
      const sessionId = createSession(userId);

      expect(sessionId).toMatch(/^[0-9a-f-]{36}$/i);
      expect(getSessionUser(sessionId)).toBe(userId);
    });

    it('returns null for an unknown session id', () => {
      expect(getSessionUser('does-not-exist')).toBeNull();
    });

    it('rejects a session for a non-existent user (foreign key enforced)', () => {
      // Fails only if PRAGMA foreign_keys = ON is actually set.
      expect(() => createSession(999_999)).toThrow();
    });
  });
});
