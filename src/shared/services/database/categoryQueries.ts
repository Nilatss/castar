import { eq, and, count as drizzleCount } from 'drizzle-orm';
import { db } from './connection';
import { categories } from './schema';
import type { Category } from '../../types';

type NewCategory = typeof categories.$inferInsert;

export function findById(id: string): Category | undefined {
  return db.select().from(categories).where(eq(categories.id, id)).get();
}

export function findAll(): Category[] {
  return db.select().from(categories).all();
}

export function findByUser(userId: string): Category[] {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.sortOrder)
    .all();
}

export function findByType(userId: string, type: Category['type']): Category[] {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, type)))
    .orderBy(categories.sortOrder)
    .all();
}

export function countByUser(userId: string): number {
  const [result] = db
    .select({ cnt: drizzleCount() })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.isDefault, false)))
    .all();
  return result?.cnt ?? 0;
}

export function insert(entity: NewCategory): void {
  db.insert(categories).values(entity).run();
}

export function update(id: string, data: Partial<NewCategory>): void {
  db.update(categories).set(data).where(eq(categories.id, id)).run();
}

function _delete(id: string): void {
  db.delete(categories).where(eq(categories.id, id)).run();
}
export { _delete as delete };
