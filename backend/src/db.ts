import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
