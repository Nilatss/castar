/**
 * Castar — Recurring Transaction React Query hooks
 *
 * GET    /recurrings              — list
 * POST   /recurrings              — create
 * PUT    /recurrings/:id          — update
 * PATCH  /recurrings/:id/pause    — toggle is_active
 * DELETE /recurrings/:id          — delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { queryKeys } from '../queryClient';
import type {
  ServerRecurring,
  CreateRecurringRequest,
  UpdateRecurringRequest,
} from '../types';

// ── Queries ──

/** Fetch all user recurring transactions */
export function useRecurrings() {
  return useQuery({
    queryKey: queryKeys.recurrings.list(),
    queryFn: () => apiClient.get<ServerRecurring[]>('/recurrings'),
  });
}

// ── Mutations ──

/** Create a new recurring transaction */
export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringRequest) =>
      apiClient.post<ServerRecurring>('/recurrings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurrings.all });
    },
  });
}

/** Update an existing recurring transaction */
export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateRecurringRequest & { id: string }) =>
      apiClient.put<ServerRecurring>(`/recurrings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurrings.all });
    },
  });
}

/** Toggle pause/resume on a recurring transaction */
export function usePauseRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<ServerRecurring>(`/recurrings/${id}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurrings.all });
    },
  });
}

/** Delete a recurring transaction */
export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/recurrings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurrings.all });
    },
  });
}
