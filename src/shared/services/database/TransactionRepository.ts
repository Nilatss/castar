import type { SQLiteBindValue } from 'expo-sqlite';
import { BaseRepository } from './BaseRepository';
import type { Transaction, TransactionFilters } from '../../types';

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions');
  }

  protected rowToEntity(row: Record<string, unknown>): Transaction {
    return {
      id: row.id as string,
      remoteId: row.remote_id as string | undefined,
      userId: row.user_id as string,
      accountId: row.account_id as string,
      categoryId: row.category_id as string,
      familyGroupId: row.family_group_id as string | undefined,
      type: row.type as Transaction['type'],
      amount: row.amount as number,
      currency: row.currency as string,
      amountInDefault: row.amount_in_default as number | undefined,
      exchangeRate: row.exchange_rate as number | undefined,
      description: row.description as string | undefined,
      date: row.date as number,
      isRecurring: (row.is_recurring as number) === 1,
      recurringId: row.recurring_id as string | undefined,
      voiceInput: (row.voice_input as number) === 1,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      syncedAt: row.synced_at as number | undefined,
    };
  }

  protected entityToRow(entity: Partial<Transaction>): Record<string, SQLiteBindValue> {
    const row: Record<string, SQLiteBindValue> = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.remoteId !== undefined) row.remote_id = entity.remoteId;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.accountId !== undefined) row.account_id = entity.accountId;
    if (entity.categoryId !== undefined) row.category_id = entity.categoryId;
    if (entity.familyGroupId !== undefined) row.family_group_id = entity.familyGroupId;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.amountInDefault !== undefined) row.amount_in_default = entity.amountInDefault;
    if (entity.exchangeRate !== undefined) row.exchange_rate = entity.exchangeRate;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.date !== undefined) row.date = entity.date;
    if (entity.isRecurring !== undefined) row.is_recurring = entity.isRecurring ? 1 : 0;
    if (entity.recurringId !== undefined) row.recurring_id = entity.recurringId;
    if (entity.voiceInput !== undefined) row.voice_input = entity.voiceInput ? 1 : 0;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.syncedAt !== undefined) row.synced_at = entity.syncedAt;
    return row;
  }

  findByUser(userId: string, limit = 100): Transaction[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT ?',
      userId,
      limit
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  findByFilters(userId: string, filters: TransactionFilters): Transaction[] {
    const conditions: string[] = ['user_id = ?'];
    const params: SQLiteBindValue[] = [userId];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters.categoryId) {
      conditions.push('category_id = ?');
      params.push(filters.categoryId);
    }
    if (filters.accountId) {
      conditions.push('account_id = ?');
      params.push(filters.accountId);
    }
    if (filters.dateFrom) {
      conditions.push('date >= ?');
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('date <= ?');
      params.push(filters.dateTo);
    }
    if (filters.amountMin !== undefined) {
      conditions.push('amount >= ?');
      params.push(filters.amountMin);
    }
    if (filters.amountMax !== undefined) {
      conditions.push('amount <= ?');
      params.push(filters.amountMax);
    }
    if (filters.search) {
      conditions.push('description LIKE ?');
      params.push(`%${filters.search}%`);
    }

    const where = conditions.join(' AND ');
    const rows = this.db.getAllSync<Record<string, unknown>>(
      `SELECT * FROM transactions WHERE ${where} ORDER BY date DESC`,
      ...params
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  getSummary(userId: string, from: number, to: number): { income: number; expense: number } {
    const result = this.db.getFirstSync<{ total_income: number; total_expense: number }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ?`,
      userId,
      from,
      to
    );
    return {
      income: result?.total_income ?? 0,
      expense: result?.total_expense ?? 0,
    };
  }

  sumByCategory(userId: string, categoryId: string, from: number, to: number): number {
    const result = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
      userId,
      categoryId,
      from,
      to
    );
    return result?.total ?? 0;
  }
}
