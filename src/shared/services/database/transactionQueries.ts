import { eq, and, gte, lte, like, sql, desc } from 'drizzle-orm';
import { db } from './connection';
import { transactions } from './schema';
import type { Transaction, TransactionFilters } from '../../types';

type NewTransaction = typeof transactions.$inferInsert;

export function findById(id: string): Transaction | undefined {
  return db.select().from(transactions).where(eq(transactions.id, id)).get();
}

export function findAll(): Transaction[] {
  return db.select().from(transactions).all();
}

export function findByUser(userId: string, limit = 100): Transaction[] {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .all();
}

export function findByFilters(userId: string, filters: TransactionFilters): Transaction[] {
  const conditions = [eq(transactions.userId, userId)];

  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.dateFrom) conditions.push(gte(transactions.date, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(transactions.date, filters.dateTo));
  if (filters.amountMin !== undefined) conditions.push(gte(transactions.amount, filters.amountMin));
  if (filters.amountMax !== undefined) conditions.push(lte(transactions.amount, filters.amountMax));
  if (filters.search) conditions.push(like(transactions.description, `%${filters.search}%`));

  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))
    .all();
}

export function getSummary(
  userId: string,
  from: number,
  to: number
): { income: number; expense: number } {
  const [result] = db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    )
    .all();

  return {
    income: result?.totalIncome ?? 0,
    expense: result?.totalExpense ?? 0,
  };
}

export function sumByCategory(
  userId: string,
  categoryId: string,
  from: number,
  to: number
): number {
  const [result] = db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.categoryId, categoryId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    )
    .all();

  return result?.total ?? 0;
}

export function insert(entity: NewTransaction): void {
  db.insert(transactions).values(entity).run();
}

export function update(id: string, data: Partial<NewTransaction>): void {
  db.update(transactions).set(data).where(eq(transactions.id, id)).run();
}

function _delete(id: string): void {
  db.delete(transactions).where(eq(transactions.id, id)).run();
}
export { _delete as delete };
