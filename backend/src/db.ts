import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type { Ride } from 'shared';
import { migrations } from './db/migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo root, independent of the current working directory. Both src/ (dev via
// tsx) and dist/ (prod) sit one level below backend/, so ../.. is the repo root.
const repoRoot = path.resolve(__dirname, '../..');

// Resolved lazily inside initDb() so DATABASE_PATH (e.g. ':memory:' in tests)
// is read at call time, not at module load. A relative DATABASE_PATH is always
// resolved against the repo root — never the CWD — so the DB lands in the same
// place whether started via `npm run dev -w backend` or from the repo root.
function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH;
  if (!configured) {
    return path.join(repoRoot, 'data', 'app.db');
  }
  if (configured === ':memory:') {
    return configured;
  }
  return path.resolve(repoRoot, configured);
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb(): void {
  try {
    const dbPath = resolveDbPath();

    // Ensure directory exists (skip for the in-memory database)
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    // better-sqlite3 leaves foreign keys OFF per connection by default. Enable
    // them so the FK constraints (incl. sessions.user_id ON DELETE CASCADE) are
    // actually enforced.
    db.pragma('foreign_keys = ON');
    console.log(`✅ Database connected: ${dbPath}`);

    // Import and run migrations
    runMigrations();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function runMigrations(): void {
  if (!db) return;

  // Schema is defined once in ./db/migrations.ts. The statements use
  // CREATE TABLE IF NOT EXISTS, so running them repeatedly is idempotent.
  console.log('Running database migrations...');

  for (const migration of migrations) {
    db.exec(migration);
  }

  console.log('✅ Database migrations completed');
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Normalize an email for storage and lookup so that addresses differing only in
 * case or surrounding whitespace are treated as the same user. Applied in every
 * helper that reads or writes the email, so the UNIQUE constraint is effectively
 * case-insensitive.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Create a new user in the database. The email is normalized before insertion.
 * @param email User email (must be unique)
 * @param passwordHash Hashed password
 * @returns User ID
 * @throws Error if email already exists
 */
export function createUser(email: string, passwordHash: string): number {
  const database = getDb();
  const stmt = database.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
  const result = stmt.run(normalizeEmail(email), passwordHash);
  return result.lastInsertRowid as number;
}

/**
 * Look up a user by email (normalized), returning the id and password hash
 * needed to verify a login. Returns undefined if no such user exists.
 */
export function getUserByEmail(email: string): { id: number; password_hash: string } | undefined {
  const database = getDb();
  const stmt = database.prepare('SELECT id, password_hash FROM users WHERE email = ?');
  return stmt.get(normalizeEmail(email)) as { id: number; password_hash: string } | undefined;
}

/**
 * Create a new session for a user and return its id (a random UUID used as the
 * opaque session token in the cookie).
 */
export function createSession(userId: number): string {
  const database = getDb();
  const sessionId = randomUUID();
  const stmt = database.prepare('INSERT INTO sessions (id, user_id) VALUES (?, ?)');
  stmt.run(sessionId, userId);
  return sessionId;
}

/**
 * Resolve a session id to its user id, or null if the session does not exist.
 */
export function getSessionUser(sessionId: string): number | null {
  const database = getDb();
  const stmt = database.prepare('SELECT user_id FROM sessions WHERE id = ?');
  const result = stmt.get(sessionId) as { user_id: number } | undefined;
  return result?.user_id ?? null;
}

/**
 * Create a new ride offer.
 * @param userId The user (driver) offering the ride
 * @param departure Start location (string)
 * @param destination End location (string)
 * @param departure_time ISO 8601 datetime string
 * @param available_seats Number of available seats (must be >= 1)
 * @returns The created Ride object with server-assigned id and created_at
 *
 * FIXME: tests missing
 */
export function createRide(
  userId: number,
  departure: string,
  destination: string,
  departure_time: string,
  available_seats: number
): Ride {
  const database = getDb();
  const stmt = database.prepare(
    'INSERT INTO rides (user_id, departure, destination, departure_time, available_seats) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(userId, departure, destination, departure_time, available_seats);
  const rideId = result.lastInsertRowid as number;

  // Retrieve and return the full created ride
  const rideStmt = database.prepare('SELECT * FROM rides WHERE id = ?');
  const row = rideStmt.get(rideId) as Ride;
  return row;
}

/**
 * Get all rides offered by a specific user, sorted by departure_time ascending.
 * @param userId The user whose rides to fetch
 * @returns Array of Ride objects
 *
 * FIXME: tests missing
 */
export function getMyRides(userId: number): Ride[] {
  const database = getDb();
  const stmt = database.prepare(
    'SELECT * FROM rides WHERE user_id = ? ORDER BY departure_time ASC'
  );
  const rows = stmt.all(userId) as Ride[];
  return rows;
}
