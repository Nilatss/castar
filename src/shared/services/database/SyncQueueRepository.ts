import type { SQLiteBindValue } from 'expo-sqlite';
import { v4 as uuid } from 'uuid';
import { BaseRepository } from './BaseRepository';
import type { SyncQueueItem, SyncAction } from '../../types';

export class SyncQueueRepository extends BaseRepository<SyncQueueItem> {
  constructor() {
    super('sync_queue');
  }

  protected rowToEntity(row: Record<string, unknown>): SyncQueueItem {
    return {
      id: row.id as string,
      tableName: row.table_name as string,
      recordId: row.record_id as string,
      action: row.action as SyncAction,
      data: row.data as string,
      createdAt: row.created_at as number,
      attempts: row.attempts as number,
      lastError: row.last_error as string | undefined,
    };
  }

  protected entityToRow(entity: Partial<SyncQueueItem>): Record<string, SQLiteBindValue> {
    const row: Record<string, SQLiteBindValue> = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.tableName !== undefined) row.table_name = entity.tableName;
    if (entity.recordId !== undefined) row.record_id = entity.recordId;
    if (entity.action !== undefined) row.action = entity.action;
    if (entity.data !== undefined) row.data = entity.data;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.attempts !== undefined) row.attempts = entity.attempts;
    if (entity.lastError !== undefined) row.last_error = entity.lastError;
    return row;
  }

  enqueue(tableName: string, recordId: string, action: SyncAction, data: unknown): void {
    const item: SyncQueueItem = {
      id: uuid(),
      tableName,
      recordId,
      action,
      data: JSON.stringify(data),
      createdAt: Date.now(),
      attempts: 0,
    };
    this.insert(item);
  }

  findPending(limit = 50): SyncQueueItem[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM sync_queue WHERE attempts < 3 ORDER BY created_at ASC LIMIT ?',
      limit
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  markSynced(id: string): void {
    this.delete(id);
  }

  recordFailure(id: string, error: string): void {
    this.db.runSync(
      'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      error,
      id
    );
  }

  pendingCount(): number {
    const result = this.db.getFirstSync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM sync_queue WHERE attempts < 3'
    );
    return result?.cnt ?? 0;
  }

  clearAll(): void {
    this.db.runSync('DELETE FROM sync_queue');
  }
}
