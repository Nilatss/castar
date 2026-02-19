import { eq, and, lte } from 'drizzle-orm';
import { db } from './connection';
import { recurrings } from './schema';
import type { RecurringTransaction } from '../../types';

type NewRecurring = typeof recurrings.$inferInsert;

export function findById(id: string): RecurringTransaction | undefined {
  return db.select().from(recurrings).where(eq(recurrings.id, id)).get();
}

export function findAll(): RecurringTransaction[] {
  return db.select().from(recurrings).all();
}

export function findByUser(userId: string): RecurringTransaction[] {
  return db
    .select()
    .from(recurrings)
    .where(and(eq(recurrings.userId, userId), eq(recurrings.isActive, true)))
    .orderBy(recurrings.nextDate)
    .all();
}

export function findDue(now: number): RecurringTransaction[] {
  return db
    .select()
    .from(recurrings)
    .where(and(eq(recurrings.isActive, true), lte(recurrings.nextDate, now)))
    .all();
}

export function pause(id: string): void {
  db.update(recurrings)
    .set({ isActive: false, updatedAt: Date.now() })
    .where(eq(recurrings.id, id))
    .run();
}

export function resume(id: string): void {
  db.update(recurrings)
    .set({ isActive: true, updatedAt: Date.now() })
    .where(eq(recurrings.id, id))
    .run();
}

export function updateNextDate(id: string, nextDate: number): void {
  db.update(recurrings)
    .set({ nextDate, updatedAt: Date.now() })
    .where(eq(recurrings.id, id))
    .run();
}

export function insert(entity: NewRecurring): void {
  db.insert(recurrings).values(entity).run();
}

export function update(id: string, data: Partial<NewRecurring>): void {
  db.update(recurrings).set(data).where(eq(recurrings.id, id)).run();
}

function _delete(id: string): void {
  db.delete(recurrings).where(eq(recurrings.id, id)).run();
}
export { _delete as delete };
