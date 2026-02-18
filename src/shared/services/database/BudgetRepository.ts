import type { SQLiteBindValue } from 'expo-sqlite';
import { BaseRepository } from './BaseRepository';
import type { Budget } from '../../types';

export class BudgetRepository extends BaseRepository<Budget> {
  constructor() {
    super('budgets');
  }

  protected rowToEntity(row: Record<string, unknown>): Budget {
    return {
      id: row.id as string,
      remoteId: row.remote_id as string | undefined,
      userId: row.user_id as string,
      familyGroupId: row.family_group_id as string | undefined,
      categoryId: row.category_id as string | undefined,
      name: row.name as string,
      amount: row.amount as number,
      currency: row.currency as string,
      period: row.period as Budget['period'],
      startDate: row.start_date as number,
      endDate: row.end_date as number | undefined,
      isActive: (row.is_active as number) === 1,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      syncedAt: row.synced_at as number | undefined,
    };
  }

  protected entityToRow(entity: Partial<Budget>): Record<string, SQLiteBindValue> {
    const row: Record<string, SQLiteBindValue> = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.remoteId !== undefined) row.remote_id = entity.remoteId;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.familyGroupId !== undefined) row.family_group_id = entity.familyGroupId;
    if (entity.categoryId !== undefined) row.category_id = entity.categoryId;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.period !== undefined) row.period = entity.period;
    if (entity.startDate !== undefined) row.start_date = entity.startDate;
    if (entity.endDate !== undefined) row.end_date = entity.endDate;
    if (entity.isActive !== undefined) row.is_active = entity.isActive ? 1 : 0;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.syncedAt !== undefined) row.synced_at = entity.syncedAt;
    return row;
  }

  findByUser(userId: string): Budget[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM budgets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
      userId
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  findByCategory(userId: string, categoryId: string): Budget | null {
    const row = this.db.getFirstSync<Record<string, unknown>>(
      'SELECT * FROM budgets WHERE user_id = ? AND category_id = ? AND is_active = 1',
      userId,
      categoryId
    );
    return row ? this.rowToEntity(row) : null;
  }

  findActive(userId: string): Budget[] {
    return this.findByUser(userId);
  }

  deactivate(id: string): void {
    this.db.runSync(
      'UPDATE budgets SET is_active = 0, updated_at = ? WHERE id = ?',
      Date.now(),
      id
    );
  }
}
