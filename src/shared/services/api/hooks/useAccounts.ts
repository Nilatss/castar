/**
 * Castar — Account React Query hooks
 *
 * GET    /accounts          — list (with ?include_archived)
 * POST   /accounts          — create
 * PUT    /accounts/:id      — update
 * DELETE /accounts/:id      — soft archive
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { queryKeys } from '../queryClient';
import type {
  ServerAccount,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '../types';

// ── Queries ──

/** Fetch user accounts */
export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.accounts.list(includeArchived),
    queryFn: () =>
      apiClient.get<ServerAccount[]>(
        '/accounts',
        includeArchived ? { include_archived: 'true' } : undefined,
      ),
  });
}

// ── Mutations ──

/** Create a new account */
export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountRequest) =>
      apiClient.post<ServerAccount>('/accounts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

/** Update an existing account */
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateAccountRequest & { id: string }) =>
      apiClient.put<ServerAccount>(`/accounts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

/** Delete (soft archive) an account */
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
