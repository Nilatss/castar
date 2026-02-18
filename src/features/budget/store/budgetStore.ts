import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Budget, CreateBudgetDTO } from '../../../shared/types';
import { budgetRepository, transactionRepository, syncQueueRepository } from '../../../shared/services/database';

function getPeriodRange(budget: Budget): { from: number; to: number } {
  const now = new Date();
  const to = now.getTime();

  switch (budget.period) {
    case 'daily': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: from.getTime(), to };
    }
    case 'weekly': {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: from.getTime(), to };
    }
    case 'monthly': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.getTime(), to };
    }
    case 'yearly': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: from.getTime(), to };
    }
    default: {
      const from = new Date(budget.startDate);
      return { from: from.getTime(), to };
    }
  }
}

function enrichBudget(budget: Budget): Budget {
  if (!budget.categoryId) return { ...budget, spent: 0, remaining: budget.amount, percentage: 0 };
  const { from, to } = getPeriodRange(budget);
  const spent = transactionRepository.sumByCategory(budget.userId, budget.categoryId, from, to);
  const remaining = Math.max(0, budget.amount - spent);
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  return { ...budget, spent, remaining, percentage };
}

interface BudgetStore {
  budgets: Budget[];
  isLoading: boolean;

  loadBudgets: (userId: string) => void;
  addBudget: (dto: CreateBudgetDTO, userId: string) => Budget;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  budgets: [],
  isLoading: false,

  loadBudgets: (userId: string) => {
    set({ isLoading: true });
    try {
      const raw = budgetRepository.findByUser(userId);
      const budgets = raw.map(enrichBudget);
      set({ budgets, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addBudget: (dto: CreateBudgetDTO, userId: string): Budget => {
    const now = Date.now();
    const budget: Budget = {
      id: uuid(),
      userId,
      familyGroupId: dto.familyGroupId,
      categoryId: dto.categoryId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency,
      period: dto.period,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    budgetRepository.insert(budget);
    syncQueueRepository.enqueue('budgets', budget.id, 'create', budget);

    const enriched = enrichBudget(budget);
    set((state) => ({ budgets: [enriched, ...state.budgets] }));
    return enriched;
  },

  updateBudget: (id: string, data: Partial<Budget>) => {
    budgetRepository.update(id, { ...data, updatedAt: Date.now() });
    syncQueueRepository.enqueue('budgets', id, 'update', data);
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? enrichBudget({ ...b, ...data, updatedAt: Date.now() }) : b
      ),
    }));
  },

  removeBudget: (id: string) => {
    budgetRepository.deactivate(id);
    syncQueueRepository.enqueue('budgets', id, 'delete', { id });
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
