import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { db, rawDb } from './connection';
import migrations from './drizzle/migrations';

/**
 * Bridge: if the app was running the old raw-SQL migration system
 * (schema_migrations table), record the baseline in Drizzle's
 * __drizzle_migrations so it doesn't re-run the initial migration.
 */
function bridgeFromLegacy(): void {
  const legacy = rawDb.getFirstSync<{ version: number }>(
    "SELECT version FROM schema_migrations WHERE version = 1 LIMIT 1"
  );
  if (!legacy) return;

  // Drizzle's migration table
  rawDb.execSync(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  const alreadyBridged = rawDb.getFirstSync<{ id: number }>(
    "SELECT id FROM __drizzle_migrations WHERE hash = '0000_strong_ares' LIMIT 1"
  );
  if (alreadyBridged) return;

  rawDb.runSync(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    '0000_strong_ares',
    Date.now()
  );

  // Drop legacy table — no longer needed
  rawDb.execSync('DROP TABLE IF EXISTS schema_migrations');
}

export function runMigrations(): void {
  // Check if legacy migration system exists
  const hasLegacyTable = rawDb.getFirstSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
  );
  if (hasLegacyTable) {
    bridgeFromLegacy();
  }

  migrate(db, migrations);
}
