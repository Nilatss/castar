/**
 * Castar — Settings React Query hooks
 *
 * GET /settings   — get user settings (with defaults)
 * PUT /settings   — upsert settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { queryKeys } from '../queryClient';
import type { ServerSettings, UpdateSettingsRequest } from '../types';

// ── Queries ──

/** Fetch current user settings */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.current(),
    queryFn: () => apiClient.get<ServerSettings>('/settings'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — settings rarely change
  });
}

// ── Mutations ──

/** Update (upsert) user settings */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) =>
      apiClient.put<ServerSettings>('/settings', data),
    onSuccess: (newSettings) => {
      // Optimistic update — replace cache immediately
      qc.setQueryData(queryKeys.settings.current(), newSettings);
    },
  });
}
