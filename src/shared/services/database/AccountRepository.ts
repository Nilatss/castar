import type { SQLiteBindValue } from 'expo-sqlite';
import { BaseRepository } from './BaseRepository';
import type { Account } from '../../types';

export class AccountRepository extends BaseRepository<Account> {
  constructor() {
    super('accounts');
  }

  protected rowToEntity(row: Record<string, unknown>): Account {
    return {
      id: row.id as string,
      remoteId: row.remote_id as string | undefined,
      userId: row.user_id as string,
      name: row.name as string,
      type: row.type as Account['type'],
      currency: row.currency as string,
      balance: row.balance as number,
      icon: row.icon as string | undefined,
      color: row.color as string | undefined,
      isArchived: (row.is_archived as number) === 1,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      syncedAt: row.synced_at as number | undefined,
    };
  }

  protected entityToRow(entity: Partial<Account>): Record<string, SQLiteBindValue> {
    const row: Record<string, SQLiteBindValue> = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.remoteId !== undefined) row.remote_id = entity.remoteId;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.balance !== undefined) row.balance = entity.balance;
    if (entity.icon !== undefined) row.icon = entity.icon;
    if (entity.color !== undefined) row.color = entity.color;
    if (entity.isArchived !== undefined) row.is_archived = entity.isArchived ? 1 : 0;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.syncedAt !== undefined) row.synced_at = entity.syncedAt;
    return row;
  }

  findByUser(userId: string): Account[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM accounts WHERE user_id = ? AND is_archived = 0 ORDER BY created_at ASC',
      userId
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  adjustBalance(id: string, delta: number): void {
    this.db.runSync(
      'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
      delta,
      Date.now(),
      id
    );
  }
}
