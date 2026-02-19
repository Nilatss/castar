import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Category, CreateCategoryDTO } from '../../../shared/types';
import { categoryRepository, syncQueueRepository } from '../../../shared/services/database';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;

  loadCategories: (userId: string) => void;
  addCategory: (dto: CreateCategoryDTO, userId: string) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  isLoading: false,

  loadCategories: (userId: string) => {
    set({ isLoading: true });
    try {
      const categories = categoryRepository.findByUser(userId);
      set({ categories, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addCategory: (dto: CreateCategoryDTO, userId: string): Category => {
    const now = Date.now();
    const existing = categoryRepository.findByUser(userId);
    const category: Category = {
      id: uuid(),
      remoteId: null,
      userId,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      type: dto.type,
      isDefault: false,
      parentId: dto.parentId ?? null,
      sortOrder: existing.length,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    };

    categoryRepository.insert(category);
    syncQueueRepository.enqueue('categories', category.id, 'create', category);

    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: (id: string, data: Partial<Category>) => {
    categoryRepository.update(id, { ...data, updatedAt: Date.now() });
    syncQueueRepository.enqueue('categories', id, 'update', data);
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c
      ),
    }));
  },

  removeCategory: (id: string) => {
    categoryRepository.delete(id);
    syncQueueRepository.enqueue('categories', id, 'delete', { id });
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
