import { v4 as uuid } from 'uuid';
import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';
import { getDatabase } from './connection';

export abstract class BaseRepository<T extends { id: string }> {
  protected db: SQLiteDatabase;

  constructor(protected tableName: string) {
    this.db = getDatabase();
  }

  protected generateId(): string {
    return uuid();
  }

  protected abstract rowToEntity(row: Record<string, unknown>): T;
  protected abstract entityToRow(entity: Partial<T>): Record<string, SQLiteBindValue>;

  findById(id: string): T | null {
    const row = this.db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      id
    );
    return row ? this.rowToEntity(row) : null;
  }

  findAll(): T[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      `SELECT * FROM ${this.tableName}`
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  insert(entity: T): void {
    const row = this.entityToRow(entity);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => row[k]);
    this.db.runSync(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      ...values
    );
  }

  update(id: string, data: Partial<T>): void {
    const row = this.entityToRow(data);
    const keys = Object.keys(row);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => row[k]);
    this.db.runSync(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      ...values,
      id
    );
  }

  delete(id: string): void {
    this.db.runSync(`DELETE FROM ${this.tableName} WHERE id = ?`, id);
  }

  count(): number {
    const result = this.db.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM ${this.tableName}`
    );
    return result?.cnt ?? 0;
  }
}
