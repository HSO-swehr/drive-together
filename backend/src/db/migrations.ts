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
  // Sessions live with User Story 2 (login); no session table until then.
];
