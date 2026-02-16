import { create } from 'zustand';
import type { AnalyticsPeriod, AnalyticsSummary } from '../../../shared/types';

interface AnalyticsStore {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary | null;
  isLoading: boolean;

  setPeriod: (period: AnalyticsPeriod) => void;
  setSummary: (summary: AnalyticsSummary) => void;
  setLoading: (loading: boolean) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  period: 'month',
  summary: null,
  isLoading: false,

  setPeriod: (period) => set({ period }),
  setSummary: (summary) => set({ summary }),
  setLoading: (isLoading) => set({ isLoading }),
}));
