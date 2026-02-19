import { eq, lt, count as drizzleCount, asc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from './connection';
import { syncQueue } from './schema';
import type { SyncAction, SyncQueueItem } from '../../types';

type NewSyncQueueItem = typeof syncQueue.$inferInsert;

export function findById(id: string): SyncQueueItem | undefined {
  return db.select().from(syncQueue).where(eq(syncQueue.id, id)).get();
}

export function findAll(): SyncQueueItem[] {
  return db.select().from(syncQueue).all();
}

export function enqueue(tableName: string, recordId: string, action: SyncAction, data: unknown): void {
  db.insert(syncQueue)
    .values({
      id: uuid(),
      tableName,
      recordId,
      action,
      data: JSON.stringify(data),
      createdAt: Date.now(),
      attempts: 0,
    })
    .run();
}

export function findPending(limit = 50): SyncQueueItem[] {
  return db
    .select()
    .from(syncQueue)
    .where(lt(syncQueue.attempts, 3))
    .orderBy(asc(syncQueue.createdAt))
    .limit(limit)
    .all();
}

export function markSynced(id: string): void {
  db.delete(syncQueue).where(eq(syncQueue.id, id)).run();
}

export function recordFailure(id: string, error: string): void {
  const item = db.select().from(syncQueue).where(eq(syncQueue.id, id)).get();
  if (!item) return;
  db.update(syncQueue)
    .set({ attempts: item.attempts + 1, lastError: error })
    .where(eq(syncQueue.id, id))
    .run();
}

export function pendingCount(): number {
  const [result] = db
    .select({ cnt: drizzleCount() })
    .from(syncQueue)
    .where(lt(syncQueue.attempts, 3))
    .all();
  return result?.cnt ?? 0;
}

export function clearAll(): void {
  db.delete(syncQueue).run();
}

export function insert(entity: NewSyncQueueItem): void {
  db.insert(syncQueue).values(entity).run();
}

export function update(id: string, data: Partial<NewSyncQueueItem>): void {
  db.update(syncQueue).set(data).where(eq(syncQueue.id, id)).run();
}

function _delete(id: string): void {
  db.delete(syncQueue).where(eq(syncQueue.id, id)).run();
}
export { _delete as delete };
