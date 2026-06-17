import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, getDb, closeDb, createUser, userExists } from '../src/db.js';

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
});
