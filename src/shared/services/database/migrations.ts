import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          remote_id TEXT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT '📁',
          color TEXT NOT NULL DEFAULT '#808080',
          type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
          is_default INTEGER NOT NULL DEFAULT 0,
          parent_id TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          synced_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          remote_id TEXT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('cash','card','bank','savings')),
          currency TEXT NOT NULL DEFAULT 'UZS',
          balance REAL NOT NULL DEFAULT 0,
          icon TEXT,
          color TEXT,
          is_archived INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          synced_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          remote_id TEXT,
          user_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          family_group_id TEXT,
          type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'UZS',
          amount_in_default REAL,
          exchange_rate REAL,
          description TEXT,
          date INTEGER NOT NULL,
          is_recurring INTEGER NOT NULL DEFAULT 0,
          recurring_id TEXT,
          voice_input INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          synced_at INTEGER,
          FOREIGN KEY (account_id) REFERENCES accounts(id),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          remote_id TEXT,
          user_id TEXT NOT NULL,
          family_group_id TEXT,
          category_id TEXT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'UZS',
          period TEXT NOT NULL CHECK(period IN ('daily','weekly','monthly','yearly')),
          start_date INTEGER NOT NULL,
          end_date INTEGER,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          synced_at INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS recurrings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'UZS',
          description TEXT,
          frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','yearly')),
          next_date INTEGER NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (account_id) REFERENCES accounts(id),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          action TEXT NOT NULL CHECK(action IN ('create','update','delete')),
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT
        );

        CREATE TABLE IF NOT EXISTS exchange_rates (
          id TEXT PRIMARY KEY,
          base_currency TEXT NOT NULL,
          target_currency TEXT NOT NULL,
          rate REAL NOT NULL,
          fetched_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id, is_active);
        CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(attempts);
      `);
    },
  },
];

export function runMigrations(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  const applied = db
    .getAllSync<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version')
    .map((r) => r.version);

  for (const migration of migrations) {
    if (!applied.includes(migration.version)) {
      migration.up(db);
      db.runSync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        migration.version,
        Date.now()
      );
    }
  }
}
