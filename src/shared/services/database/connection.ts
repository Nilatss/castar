import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Synchronous database reference — initialized in initDb()
let _db: ReturnType<typeof drizzle> | null = null;
let _rawDb: ReturnType<typeof openDatabaseSync> | null = null;

/**
 * Initialize the SQLite database.
 * Must be called once at app startup (before any DB access).
 *
 * NOTE: SQLCipher encryption is deferred until a custom native build
 * is created (expo prebuild / EAS Build). The standard expo-sqlite
 * module works in Expo Go and dev builds without config plugins.
 * When ready, re-add `["expo-sqlite", { "useSQLCipher": true }]` to
 * app.json and restore PRAGMA key logic here.
 */
export async function initDb(): Promise<void> {
  if (_db) return; // Already initialized

  const expoDb = openDatabaseSync('castar.db');

  expoDb.execSync('PRAGMA journal_mode = WAL');
  expoDb.execSync('PRAGMA foreign_keys = ON');

  _rawDb = expoDb;
  _db = drizzle(expoDb, { schema });
}

// Keep old name as alias so callers using initEncryptedDb() still work
export const initEncryptedDb = initDb;

/**
 * Get the Drizzle ORM database instance.
 * Throws if initDb() hasn't been called yet.
 */
export function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _db;
}

/**
 * Get the raw expo-sqlite database instance.
 * Throws if initDb() hasn't been called yet.
 */
export function getRawDb(): ReturnType<typeof openDatabaseSync> {
  if (!_rawDb) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _rawDb;
}

/**
 * Force re-open the database.
 * Used to recover from "NativeDatabase has already been deallocated" errors
 * (common in dev builds with hot reload / New Architecture / Hermes GC).
 */
export function reopenDb(): void {
  _db = null;
  _rawDb = null;

  const expoDb = openDatabaseSync('castar.db');

  expoDb.execSync('PRAGMA journal_mode = WAL');
  expoDb.execSync('PRAGMA foreign_keys = ON');

  _rawDb = expoDb;
  _db = drizzle(expoDb, { schema });
}

/**
 * Execute a DB operation with automatic retry on NativeDatabase deallocation.
 * If the native handle was GC'd, re-opens the database and retries once.
 */
export function withDbRetry<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e: any) {
    if (e?.message?.includes('deallocated')) {
      reopenDb();
      return fn();
    }
    throw e;
  }
}

// Backward compatibility — Proxy-based lazy getters so existing code
// using `import { db, rawDb }` keeps working without changes.
// All property accesses are forwarded to the initialized instance.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const rawDb = new Proxy({} as ReturnType<typeof openDatabaseSync>, {
  get(_, prop) {
    const instance = getRawDb();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});
