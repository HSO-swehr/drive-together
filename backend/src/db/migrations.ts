// Single source of truth for the database schema.
// Imported and executed by src/db.ts during initialization (idempotent).

export const migrations = [
  // Users table
  `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `,

  // Sessions table (created on login).
  // Note: sessions do not expire yet — there is intentionally no expires_at
  // column or expiry check. Add one here (plus a check in getSessionUser) when
  // session expiration becomes a requirement.
  `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  // Rides table (created for ride offerings).
  `
    CREATE TABLE IF NOT EXISTS rides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      departure TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time DATETIME NOT NULL,
      available_seats INTEGER NOT NULL CHECK (available_seats > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  // Indices for common queries
  `
    CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id)
  `,

  `
    CREATE INDEX IF NOT EXISTS idx_rides_departure_time ON rides(departure_time)
  `,
];
