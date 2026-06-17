import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { randomUUID } from 'crypto';
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
 * Check if a user with the given email exists. The email is normalized before
 * lookup, mirroring createUser.
 * @param email Email to check
 * @returns true if user exists, false otherwise
 */
export function userExists(email: string): boolean {
  const database = getDb();
  const stmt = database.prepare('SELECT 1 FROM users WHERE email = ?');
  const result = stmt.get(normalizeEmail(email));
  return result !== undefined;
}

/**
 * Create a new session for a user.
 * @param userId User ID to create session for
 * @returns Session ID
 */
export function createSession(userId: number): string {
  const database = getDb();
  const sessionId = randomUUID();
  const stmt = database.prepare('INSERT INTO sessions (id, user_id) VALUES (?, ?)');
  stmt.run(sessionId, userId);
  return sessionId;
}

/**
 * Get the user ID for a given session ID.
 * @param sessionId Session ID to look up
 * @returns User ID if session exists, null otherwise
 */
export function getSessionUser(sessionId: string): number | null {
  const database = getDb();
  const stmt = database.prepare('SELECT user_id FROM sessions WHERE id = ?');
  const result = stmt.get(sessionId) as { user_id: number } | undefined;
  return result?.user_id ?? null;
}
