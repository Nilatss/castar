/**
 * Castar — React Query Configuration
 *
 * Centralized QueryClient with sensible defaults for a finance app:
 * - 5 min staleTime (data is fresh for 5 min after fetch)
 * - 10 min gcTime (cache garbage-collected after 10 min)
 * - 2 retries with exponential backoff
 * - Mutations don't retry by default
 */

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes (was cacheTime in v4)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,      // Mobile app — no window focus events
      refetchOnReconnect: true,         // Refetch when device comes back online
    },
    mutations: {
      retry: false,                     // Mutations should not auto-retry
    },
  },
});

// ── Query key factories ──

export const queryKeys = {
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    list: (params?: Record<string, string>) => ['transactions', 'list', params] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    summary: (params?: Record<string, string>) => ['transactions', 'summary', params] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
  },

  // Accounts
  accounts: {
    all: ['accounts'] as const,
    list: (includeArchived?: boolean) => ['accounts', 'list', { includeArchived }] as const,
  },

  // Budgets
  budgets: {
    all: ['budgets'] as const,
    list: () => ['budgets', 'list'] as const,
  },

  // Recurrings
  recurrings: {
    all: ['recurrings'] as const,
    list: () => ['recurrings', 'list'] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    current: () => ['settings', 'current'] as const,
  },
} as const;
