import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as schema from './schema';

const DB_KEY_STORE = 'castar_db_encryption_key';

/**
 * Get or generate the SQLite encryption key.
 * Stored in SecureStore (hardware-backed keychain on iOS, EncryptedSharedPreferences on Android).
 */
async function getOrCreateDbKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(DB_KEY_STORE);
  if (!key) {
    // Generate a random 32-byte hex key (256-bit AES)
    // Uses Web Crypto API (built into Hermes / RN 0.81+)
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync(DB_KEY_STORE, key);
  }
  return key;
}

// Synchronous database reference — initialized in initEncryptedDb()
let _db: ReturnType<typeof drizzle> | null = null;
let _rawDb: ReturnType<typeof openDatabaseSync> | null = null;

/**
 * Initialize the encrypted SQLite database.
 * Must be called once at app startup (before any DB access).
 * Uses SQLCipher for 256-bit AES encryption of the database file.
 */
export async function initEncryptedDb(): Promise<void> {
  if (_db) return; // Already initialized

  const key = await getOrCreateDbKey();

  const expoDb = openDatabaseSync('castar.db');

  // Set encryption key FIRST — before any other PRAGMA or query
  // SQLCipher uses PRAGMA key to decrypt/encrypt the database file
  expoDb.execSync(`PRAGMA key = '${key}'`);
  expoDb.execSync('PRAGMA journal_mode = WAL');
  expoDb.execSync('PRAGMA foreign_keys = ON');

  _rawDb = expoDb;
  _db = drizzle(expoDb, { schema });
}

/**
 * Get the Drizzle ORM database instance.
 * Throws if initEncryptedDb() hasn't been called yet.
 */
export function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    throw new Error('Database not initialized. Call initEncryptedDb() first.');
  }
  return _db;
}

/**
 * Get the raw expo-sqlite database instance.
 * Throws if initEncryptedDb() hasn't been called yet.
 */
export function getRawDb(): ReturnType<typeof openDatabaseSync> {
  if (!_rawDb) {
    throw new Error('Database not initialized. Call initEncryptedDb() first.');
  }
  return _rawDb;
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
