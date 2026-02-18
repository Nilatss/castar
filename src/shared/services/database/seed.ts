import { v4 as uuid } from 'uuid';
import type { SQLiteDatabase } from 'expo-sqlite';
import { defaultCategories } from '../../constants';

export function seedDefaults(db: SQLiteDatabase, userId: string): void {
  // Check if categories already exist for this user
  const existing = db.getFirstSync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM categories WHERE user_id = ?',
    userId
  );
  if (existing && existing.cnt > 0) return;

  const now = Date.now();

  db.execSync('BEGIN TRANSACTION');
  try {
    // Seed default categories
    for (let i = 0; i < defaultCategories.length; i++) {
      const cat = defaultCategories[i];
      db.runSync(
        `INSERT INTO categories (id, user_id, name, icon, color, type, is_default, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        uuid(),
        userId,
        cat.nameKey,
        cat.icon,
        cat.color,
        cat.type,
        i,
        now,
        now
      );
    }

    // Seed default Cash account
    db.runSync(
      `INSERT INTO accounts (id, user_id, name, type, currency, balance, icon, created_at, updated_at)
       VALUES (?, ?, 'Cash', 'cash', 'UZS', 0, '💵', ?, ?)`,
      uuid(),
      userId,
      now,
      now
    );

    db.execSync('COMMIT');
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
}
