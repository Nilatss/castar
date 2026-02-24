/**
 * Castar — API Types
 *
 * Server-side types (camelCase, after conversion from snake_case).
 * These match the D1 schema but with camelCase keys.
 */

// ── Server entities (returned by GET endpoints, already camelCase after apiClient conversion) ──

export interface ServerTransaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string | null;
  date: number;
  isRecurring: number;          // D1 returns 0/1 for booleans
  recurringId: string | null;
  voiceInput: number;           // 0/1
  createdAt: number;
  updatedAt: number;
}

export interface ServerCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isDefault: number;            // 0/1
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface ServerAccount {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'card' | 'bank' | 'savings';
  currency: string;
  balance: number;
  icon: string | null;
  color: string | null;
  isArchived: number;           // 0/1
  createdAt: number;
  updatedAt: number;
}

export interface ServerBudget {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  amount: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: number;
  isActive: number;             // 0/1
  createdAt: number;
  updatedAt: number;
  // Enriched fields from GET /budgets
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface ServerRecurring {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: number;
  isActive: number;             // 0/1
  createdAt: number;
  updatedAt: number;
}

export interface ServerSettings {
  id?: string;
  userId: string;
  displayName: string | null;
  language: string;
  primaryCurrency: string;
  tier: string;
  createdAt?: number;
  updatedAt?: number;
}

// ── Request DTOs (camelCase, will be converted to snake_case by apiClient) ──

export interface CreateTransactionRequest {
  id: string;
  accountId?: string | null;
  categoryId?: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description?: string | null;
  date: number;
  isRecurring?: boolean;
  recurringId?: string | null;
  voiceInput?: boolean;
}

export interface UpdateTransactionRequest {
  accountId?: string | null;
  categoryId?: string | null;
  type?: 'income' | 'expense' | 'transfer';
  amount?: number;
  currency?: string;
  description?: string | null;
  date?: number;
}

export interface CreateCategoryRequest {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense';
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense';
  sortOrder?: number;
}

export interface CreateAccountRequest {
  id: string;
  name: string;
  type?: 'cash' | 'card' | 'bank' | 'savings';
  currency?: string;
  balance?: number;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: 'cash' | 'card' | 'bank' | 'savings';
  currency?: string;
  icon?: string | null;
  color?: string | null;
}

export interface CreateBudgetRequest {
  id: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  currency?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: number;
}

export interface UpdateBudgetRequest {
  categoryId?: string | null;
  name?: string;
  amount?: number;
  currency?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: number;
}

export interface CreateRecurringRequest {
  id: string;
  accountId?: string | null;
  categoryId?: string | null;
  type: 'income' | 'expense';
  amount: number;
  currency?: string;
  description?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: number;
}

export interface UpdateRecurringRequest {
  accountId?: string | null;
  categoryId?: string | null;
  type?: 'income' | 'expense';
  amount?: number;
  currency?: string;
  description?: string | null;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate?: number;
}

export interface UpdateSettingsRequest {
  displayName?: string | null;
  language?: string;
  primaryCurrency?: string;
}

// ── Summary / Sync types ──

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
}

export interface SyncPushRequest {
  operations: Array<{
    table: 'categories' | 'accounts' | 'transactions' | 'budgets' | 'recurrings';
    recordId: string;
    action: 'create' | 'update' | 'delete';
    data?: Record<string, unknown>;
  }>;
}

export interface SyncPullRequest {
  lastSyncedAt: number;
  tables?: Array<'categories' | 'accounts' | 'transactions' | 'budgets' | 'recurrings'>;
}

export interface SyncFullRequest {
  operations?: SyncPushRequest['operations'];
  lastSyncedAt?: number;
  tables?: SyncPullRequest['tables'];
}

export interface SyncPushResult {
  processed: number;
  failed: number;
  results: Array<{
    recordId: string;
    table: string;
    action: string;
    ok: boolean;
    error?: string;
  }>;
}

export interface SyncPullResult {
  changes: Record<string, unknown[]>;
  totalChanges: number;
  serverTime: number;
}

export interface SyncFullResult {
  push: SyncPushResult;
  pull: SyncPullResult;
  serverTime: number;
}
