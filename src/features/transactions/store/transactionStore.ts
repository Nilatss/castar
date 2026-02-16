import { create } from 'zustand';
import type { Transaction, TransactionFilters, CreateTransactionDTO, UpdateTransactionDTO } from '../../../shared/types';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  filters: TransactionFilters;

  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: TransactionFilters = {};

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  isLoading: false,
  filters: defaultFilters,

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  updateTransaction: (id, data) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),

  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setLoading: (isLoading) => set({ isLoading }),
}));
