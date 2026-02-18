export { getDatabase } from './connection';
export { runMigrations } from './migrations';
export { seedDefaults } from './seed';

import { CategoryRepository } from './CategoryRepository';
import { AccountRepository } from './AccountRepository';
import { TransactionRepository } from './TransactionRepository';
import { BudgetRepository } from './BudgetRepository';
import { RecurringRepository } from './RecurringRepository';
import { SyncQueueRepository } from './SyncQueueRepository';

// Singleton instances
export const categoryRepository = new CategoryRepository();
export const accountRepository = new AccountRepository();
export const transactionRepository = new TransactionRepository();
export const budgetRepository = new BudgetRepository();
export const recurringRepository = new RecurringRepository();
export const syncQueueRepository = new SyncQueueRepository();

export { CategoryRepository, AccountRepository, TransactionRepository, BudgetRepository, RecurringRepository, SyncQueueRepository };

/** Initialize database: run migrations and seed defaults. */
export function initDatabase(userId: string): void {
  const { getDatabase } = require('./connection');
  const { runMigrations } = require('./migrations');
  const { seedDefaults } = require('./seed');
  const db = getDatabase();
  runMigrations(db);
  seedDefaults(db, userId);
}
