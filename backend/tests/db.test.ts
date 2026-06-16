import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, getDb, closeDb } from '../src/db';

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
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as Array<{ name: string }>;

    const tables = tableNames.map((t) => t.name);

    expect(tables).toContain('users');
    expect(tables).toContain('rides');
    expect(tables).toContain('bookings');
  });
});
