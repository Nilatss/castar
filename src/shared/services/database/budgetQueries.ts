import { eq, and, desc } from 'drizzle-orm';
import { db } from './connection';
import { budgets } from './schema';
import type { Budget } from '../../types';

type NewBudget = typeof budgets.$inferInsert;

export function findById(id: string): Budget | undefined {
  return db.select().from(budgets).where(eq(budgets.id, id)).get() as unknown as Budget | undefined;
}

export function findAll(): Budget[] {
  return db.select().from(budgets).all() as unknown as Budget[];
}

export function findByUser(userId: string): Budget[] {
  return db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)))
    .orderBy(desc(budgets.createdAt))
    .all() as unknown as Budget[];
}

export function findByCategory(userId: string, categoryId: string): Budget | undefined {
  return db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.categoryId, categoryId),
        eq(budgets.isActive, true)
      )
    )
    .get() as unknown as Budget | undefined;
}

export function findActive(userId: string): Budget[] {
  return findByUser(userId);
}

export function deactivate(id: string): void {
  db.update(budgets)
    .set({ isActive: false, updatedAt: Date.now() })
    .where(eq(budgets.id, id))
    .run();
}

export function insert(entity: NewBudget): void {
  db.insert(budgets).values(entity).run();
}

export function update(id: string, data: Partial<NewBudget>): void {
  db.update(budgets).set(data).where(eq(budgets.id, id)).run();
}

function _delete(id: string): void {
  db.delete(budgets).where(eq(budgets.id, id)).run();
}
export { _delete as delete };
