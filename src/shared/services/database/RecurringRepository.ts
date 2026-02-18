import type { SQLiteBindValue } from 'expo-sqlite';
import { BaseRepository } from './BaseRepository';
import type { RecurringTransaction } from '../../types';

export class RecurringRepository extends BaseRepository<RecurringTransaction> {
  constructor() {
    super('recurrings');
  }

  protected rowToEntity(row: Record<string, unknown>): RecurringTransaction {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      accountId: row.account_id as string,
      categoryId: row.category_id as string,
      type: row.type as RecurringTransaction['type'],
      amount: row.amount as number,
      currency: row.currency as string,
      description: row.description as string | undefined,
      frequency: row.frequency as RecurringTransaction['frequency'],
      nextDate: row.next_date as number,
      isActive: (row.is_active as number) === 1,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  protected entityToRow(entity: Partial<RecurringTransaction>): Record<string, SQLiteBindValue> {
    const row: Record<string, SQLiteBindValue> = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.accountId !== undefined) row.account_id = entity.accountId;
    if (entity.categoryId !== undefined) row.category_id = entity.categoryId;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.frequency !== undefined) row.frequency = entity.frequency;
    if (entity.nextDate !== undefined) row.next_date = entity.nextDate;
    if (entity.isActive !== undefined) row.is_active = entity.isActive ? 1 : 0;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    return row;
  }

  findByUser(userId: string): RecurringTransaction[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM recurrings WHERE user_id = ? AND is_active = 1 ORDER BY next_date ASC',
      userId
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  findDue(now: number): RecurringTransaction[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM recurrings WHERE is_active = 1 AND next_date <= ?',
      now
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  pause(id: string): void {
    this.db.runSync(
      'UPDATE recurrings SET is_active = 0, updated_at = ? WHERE id = ?',
      Date.now(),
      id
    );
  }

  resume(id: string): void {
    this.db.runSync(
      'UPDATE recurrings SET is_active = 1, updated_at = ? WHERE id = ?',
      Date.now(),
      id
    );
  }

  updateNextDate(id: string, nextDate: number): void {
    this.db.runSync(
      'UPDATE recurrings SET next_date = ?, updated_at = ? WHERE id = ?',
      nextDate,
      Date.now(),
      id
    );
  }
}
