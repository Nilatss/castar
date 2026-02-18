import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Transaction, TransactionFilters, CreateTransactionDTO } from '../../../shared/types';
import { transactionRepository, accountRepository, syncQueueRepository } from '../../../shared/services/database';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  filters: TransactionFilters;

  loadTransactions: (userId: string) => void;
  addTransaction: (dto: CreateTransactionDTO, userId: string) => Transaction;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: TransactionFilters = {};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  filters: defaultFilters,

  loadTransactions: (userId: string) => {
    set({ isLoading: true });
    try {
      const filters = get().filters;
      const hasFilters = Object.keys(filters).length > 0;
      const transactions = hasFilters
        ? transactionRepository.findByFilters(userId, filters)
        : transactionRepository.findByUser(userId);
      set({ transactions, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTransaction: (dto: CreateTransactionDTO, userId: string): Transaction => {
    const now = Date.now();
    const transaction: Transaction = {
      id: uuid(),
      userId,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      familyGroupId: dto.familyGroupId,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      date: dto.date,
      isRecurring: false,
      voiceInput: dto.voiceInput ?? false,
      createdAt: now,
      updatedAt: now,
    };

    transactionRepository.insert(transaction);

    // Adjust account balance
    const delta = dto.type === 'income' ? dto.amount : -dto.amount;
    accountRepository.adjustBalance(dto.accountId, delta);

    // Enqueue sync
    syncQueueRepository.enqueue('transactions', transaction.id, 'create', transaction);

    set((state) => ({ transactions: [transaction, ...state.transactions] }));
    return transaction;
  },

  updateTransaction: (id: string, data: Partial<Transaction>) => {
    transactionRepository.update(id, { ...data, updatedAt: Date.now() });
    syncQueueRepository.enqueue('transactions', id, 'update', data);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t
      ),
    }));
  },

  removeTransaction: (id: string) => {
    const tx = transactionRepository.findById(id);
    if (tx) {
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      accountRepository.adjustBalance(tx.accountId, delta);
      transactionRepository.delete(id);
      syncQueueRepository.enqueue('transactions', id, 'delete', { id });
    }
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setLoading: (isLoading) => set({ isLoading }),
}));
