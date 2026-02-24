/**
 * Castar — Category React Query hooks
 *
 * GET    /categories      — list all user categories
 * POST   /categories      — create
 * PUT    /categories/:id  — update
 * DELETE /categories/:id  — delete (+ reassign transactions)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { queryKeys } from '../queryClient';
import type {
  ServerCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types';

// ── Queries ──

/** Fetch all user categories */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => apiClient.get<ServerCategory[]>('/categories'),
  });
}

// ── Mutations ──

/** Create a new category */
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) =>
      apiClient.post<ServerCategory>('/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/** Update an existing category */
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCategoryRequest & { id: string }) =>
      apiClient.put<ServerCategory>(`/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/** Delete a category */
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      // Transactions may have been reassigned
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}
