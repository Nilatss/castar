import type { SQLiteBindValue } from 'expo-sqlite';
import { BaseRepository } from './BaseRepository';
import type { Category } from '../../types';

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }

  protected rowToEntity(row: Record<string, unknown>): Category {
    return {
      id: row.id as string,
      remoteId: row.remote_id as string | undefined,
      userId: row.user_id as string,
      name: row.name as string,
      icon: row.icon as string,
      color: row.color as string,
      type: row.type as Category['type'],
      isDefault: (row.is_default as number) === 1,
      parentId: row.parent_id as string | undefined,
      sortOrder: row.sort_order as number,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      syncedAt: row.synced_at as number | undefined,
    };
  }

  protected entityToRow(entity: Partial<Category>): Record<string, SQLiteBindValue> {
    const row: Record<string, SQLiteBindValue> = {};
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.remoteId !== undefined) row.remote_id = entity.remoteId;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.icon !== undefined) row.icon = entity.icon;
    if (entity.color !== undefined) row.color = entity.color;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.isDefault !== undefined) row.is_default = entity.isDefault ? 1 : 0;
    if (entity.parentId !== undefined) row.parent_id = entity.parentId;
    if (entity.sortOrder !== undefined) row.sort_order = entity.sortOrder;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.syncedAt !== undefined) row.synced_at = entity.syncedAt;
    return row;
  }

  findByUser(userId: string): Category[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY sort_order ASC',
      userId
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  findByType(userId: string, type: Category['type']): Category[] {
    const rows = this.db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY sort_order ASC',
      userId,
      type
    );
    return rows.map((r) => this.rowToEntity(r));
  }

  countByUser(userId: string): number {
    const result = this.db.getFirstSync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM categories WHERE user_id = ? AND is_default = 0',
      userId
    );
    return result?.cnt ?? 0;
  }
}
