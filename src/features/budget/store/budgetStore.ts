import { create } from 'zustand';
import type { Budget } from '../../../shared/types';

interface BudgetStore {
  budgets: Budget[];
  isLoading: boolean;

  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  budgets: [],
  isLoading: false,

  setBudgets: (budgets) => set({ budgets }),

  addBudget: (budget) =>
    set((state) => ({ budgets: [budget, ...state.budgets] })),

  updateBudget: (id, data) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...data } : b
      ),
    })),

  removeBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));
