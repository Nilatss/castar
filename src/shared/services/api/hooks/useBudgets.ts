/**
 * Castar — Budget React Query hooks
 *
 * GET    /budgets          — list (enriched: spent, remaining, percentage)
 * POST   /budgets          — create
 * PUT    /budgets/:id      — update
 * DELETE /budgets/:id      — soft deactivate
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { queryKeys } from '../queryClient';
import type {
  ServerBudget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../types';

// ── Queries ──

/** Fetch all user budgets (enriched with spent/remaining/percentage) */
export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets.list(),
    queryFn: () => apiClient.get<ServerBudget[]>('/budgets'),
  });
}

// ── Mutations ──

/** Create a new budget */
export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) =>
      apiClient.post<ServerBudget>('/budgets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}

/** Update an existing budget */
export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBudgetRequest & { id: string }) =>
      apiClient.put<ServerBudget>(`/budgets/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}

/** Delete (soft deactivate) a budget */
export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}
