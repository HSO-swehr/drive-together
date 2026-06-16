import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/app.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb(): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });

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

  // Check if migrations have already run
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .all().length > 0;

  if (tableExists) {
    console.log('✅ Database schema already initialized');
    return;
  }

  console.log('Running database migrations...');

  const migrations = [
    `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
    `
      CREATE TABLE rides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        start_location TEXT NOT NULL,
        end_location TEXT NOT NULL,
        departure_time DATETIME NOT NULL,
        available_seats INTEGER NOT NULL CHECK (available_seats > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
    `
      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ride_id INTEGER NOT NULL,
        passenger_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ride_id, passenger_id),
        FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
        FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
  ];

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
