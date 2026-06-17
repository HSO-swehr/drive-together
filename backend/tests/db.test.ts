import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initDb,
  getDb,
  closeDb,
  createUser,
  userExists,
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

    it('should check if user exists by email', () => {
      createUser('existing@example.com', 'hashed_password');

      expect(userExists('existing@example.com')).toBe(true);
      expect(userExists('nonexistent@example.com')).toBe(false);
    });

    it('should throw error when creating user with duplicate email', () => {
      createUser('duplicate@example.com', 'password1');

      expect(() => {
        createUser('duplicate@example.com', 'password2');
      }).toThrow();
    });

    it('should treat emails case- and whitespace-insensitively', () => {
      createUser('  Normalized@Example.com ', 'hashed_password');

      // Lookup with a differently-cased / padded variant finds the same user
      expect(userExists('normalized@example.com')).toBe(true);
      expect(userExists('NORMALIZED@EXAMPLE.COM')).toBe(true);

      // A variant that only differs in case/whitespace is a duplicate
      expect(() => {
        createUser('normalized@example.com', 'password2');
      }).toThrow();
    });
  });

  describe('Session Operations', () => {
    it('should create a session and return session id', () => {
      const userId = createUser('session@example.com', 'hashed_password');
      const sessionId = createSession(userId);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should get user id for a valid session', () => {
      const userId = createUser('getsession@example.com', 'hashed_password');
      const sessionId = createSession(userId);

      const retrievedUserId = getSessionUser(sessionId);
      expect(retrievedUserId).toBe(userId);
    });

    it('should return null for invalid session id', () => {
      const result = getSessionUser('nonexistent-session-id');
      expect(result).toBeNull();
    });

    it('should create multiple sessions for same user', () => {
      const userId = createUser('multisession@example.com', 'hashed_password');
      const sessionId1 = createSession(userId);
      const sessionId2 = createSession(userId);

      expect(sessionId1).not.toBe(sessionId2);
      expect(getSessionUser(sessionId1)).toBe(userId);
      expect(getSessionUser(sessionId2)).toBe(userId);
    });
  });
});
