/**
 * Castar — React Query hooks barrel export
 */

// Transactions
export {
  useTransactions,
  useTransaction,
  useTransactionSummary,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from './useTransactions';
export type { TransactionListParams } from './useTransactions';

// Categories
export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './useCategories';

// Accounts
export {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from './useAccounts';

// Budgets
export {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from './useBudgets';

// Recurrings
export {
  useRecurrings,
  useCreateRecurring,
  useUpdateRecurring,
  usePauseRecurring,
  useDeleteRecurring,
} from './useRecurrings';

// Settings
export {
  useSettings,
  useUpdateSettings,
} from './useSettings';

// Sync
export {
  useSyncPush,
  useSyncPull,
  useSyncFull,
} from './useSync';
