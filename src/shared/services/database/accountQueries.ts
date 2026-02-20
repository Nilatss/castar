import { eq, and, sql } from 'drizzle-orm';
import { db } from './connection';
import { accounts } from './schema';
import type { Account } from '../../types';

type NewAccount = typeof accounts.$inferInsert;

export function findById(id: string): Account | undefined {
  return db.select().from(accounts).where(eq(accounts.id, id)).get() as unknown as Account | undefined;
}

export function findAll(): Account[] {
  return db.select().from(accounts).all() as unknown as Account[];
}

export function findByUser(userId: string): Account[] {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false)))
    .orderBy(accounts.createdAt)
    .all() as unknown as Account[];
}

export function adjustBalance(id: string, delta: number): void {
  db.update(accounts)
    .set({
      balance: sql`${accounts.balance} + ${delta}`,
      updatedAt: Date.now(),
    })
    .where(eq(accounts.id, id))
    .run();
}

export function insert(entity: NewAccount): void {
  db.insert(accounts).values(entity).run();
}

export function update(id: string, data: Partial<NewAccount>): void {
  db.update(accounts).set(data).where(eq(accounts.id, id)).run();
}

function _delete(id: string): void {
  db.delete(accounts).where(eq(accounts.id, id)).run();
}
export { _delete as delete };
