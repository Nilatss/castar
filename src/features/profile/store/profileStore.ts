import { create } from 'zustand';
import type { User, AppSettings, Currency } from '../../../shared/types';

interface ProfileStore {
  user: User | null;
  settings: AppSettings;

  setUser: (user: User) => void;
  updateUser: (data: Partial<User>) => void;
  updateSettings: (data: Partial<AppSettings>) => void;
  setDefaultCurrency: (currency: Currency) => void;
  setLanguage: (lang: 'uz' | 'ru' | 'en') => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  user: null,
  settings: {
    theme: 'dark',
    notifications: true,
    biometricLock: false,
  },

  setUser: (user) => set({ user }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  updateSettings: (data) =>
    set((state) => ({
      settings: { ...state.settings, ...data },
    })),

  setDefaultCurrency: (currency) =>
    set((state) => ({
      user: state.user ? { ...state.user, defaultCurrency: currency } : null,
    })),

  setLanguage: (lang) =>
    set((state) => ({
      user: state.user ? { ...state.user, language: lang } : null,
    })),
}));
