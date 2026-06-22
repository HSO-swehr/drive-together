import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initDb,
  getDb,
  closeDb,
  createUser,
  getUserByEmail,
  createSession,
  getSessionUser,
  createRide,
  getMyRides,
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

  describe('Ride Operations', () => {
    it('should create a ride and return ride object with id', () => {
      const userId = createUser('driver@example.com', 'hashed_password');
      const now = new Date();
      const futureTime = new Date(now.getTime() + 86400000).toISOString(); // +1 day

      const ride = createRide(userId, 'Berlin', 'Munich', futureTime, 3);

      expect(ride.id).toBeGreaterThan(0);
      expect(ride.user_id).toBe(userId);
      expect(ride.departure).toBe('Berlin');
      expect(ride.destination).toBe('Munich');
      expect(ride.departure_time).toBe(futureTime);
      expect(ride.available_seats).toBe(3);
      expect(ride.created_at).toBeDefined();
    });

    it('should reject available_seats below the allowed minimum', () => {
      const userId = createUser('driver2@example.com', 'hashed_password');
      const futureTime = new Date(Date.now() + 86400000).toISOString();

      expect(() => {
        createRide(userId, 'Start', 'End', futureTime, 0);
      }).toThrow();
    });

    it('should reject available_seats above the allowed maximum', () => {
      const userId = createUser('driver2b@example.com', 'hashed_password');
      const futureTime = new Date(Date.now() + 86400000).toISOString();

      expect(() => {
        createRide(userId, 'Start', 'End', futureTime, 10);
      }).toThrow();
    });

    it('should retrieve rides for a specific user', () => {
      const userId = createUser('driver3@example.com', 'hashed_password');
      const otherUserId = createUser('driver4@example.com', 'hashed_password');

      const futureTime1 = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      const futureTime2 = new Date(Date.now() + 172800000).toISOString(); // day after tomorrow

      const ride1 = createRide(userId, 'Berlin', 'Munich', futureTime1, 2);
      const ride2 = createRide(userId, 'Hamburg', 'Cologne', futureTime2, 3);
      // Create a ride for another user to ensure filtering works
      createRide(otherUserId, 'Dresden', 'Leipzig', futureTime1, 1);

      const userRides = getMyRides(userId);

      expect(userRides.length).toBe(2);
      expect(userRides[0].id).toBe(ride1.id);
      expect(userRides[1].id).toBe(ride2.id);
    });

    it('should sort rides by departure_time ascending', () => {
      const userId = createUser('driver5@example.com', 'hashed_password');

      const futureTime1 = new Date(Date.now() + 86400000).toISOString(); // +1 day
      const futureTime2 = new Date(Date.now() + 172800000).toISOString(); // +2 days
      const futureTime3 = new Date(Date.now() + 259200000).toISOString(); // +3 days

      // Insert in random order
      createRide(userId, 'A', 'B', futureTime2, 1);
      createRide(userId, 'C', 'D', futureTime3, 1);
      createRide(userId, 'E', 'F', futureTime1, 1);

      const rides = getMyRides(userId);

      expect(rides.length).toBe(3);
      expect(rides[0].departure_time).toBe(futureTime1);
      expect(rides[1].departure_time).toBe(futureTime2);
      expect(rides[2].departure_time).toBe(futureTime3);
    });

    it('should return empty array for user with no rides', () => {
      const userId = createUser('driver6@example.com', 'hashed_password');

      const rides = getMyRides(userId);

      expect(rides).toEqual([]);
    });

    it('should reject rides for non-existent user (foreign key enforced)', () => {
      const futureTime = new Date(Date.now() + 86400000).toISOString();

      expect(() => {
        createRide(999_999, 'Start', 'End', futureTime, 1);
      }).toThrow();
    });
  });
});
