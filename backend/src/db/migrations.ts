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

  // Sessions table
  // Note: sessions currently do not expire — there is intentionally no
  // expires_at column or expiry check yet. Add one here (plus a check in
  // getSessionUser) when session expiration becomes a requirement.
  `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
];
