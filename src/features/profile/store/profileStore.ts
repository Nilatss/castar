import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import i18n from '../../../shared/i18n';
import type { User, AppSettings, Currency } from '../../../shared/types';

// ═══════════════════════════════════════════════
// SecureStore keys
// ═══════════════════════════════════════════════

const LANGUAGE_KEY = 'castar_language';
const CURRENCY_KEY = 'castar_currency';

// ═══════════════════════════════════════════════
// Store interface
// ═══════════════════════════════════════════════

interface ProfileStore {
  user: User | null;
  settings: AppSettings;
  language: string;
  currency: string;

  initializeSettings: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (data: Partial<User>) => void;
  updateSettings: (data: Partial<AppSettings>) => void;
  setDefaultCurrency: (currency: string) => void;
  setLanguage: (lang: string) => void;
}

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

export const useProfileStore = create<ProfileStore>((set) => ({
  user: null,
  settings: {
    theme: 'dark',
    notifications: true,
    biometricLock: false,
  },
  language: i18n.language || 'en',
  currency: 'UZS',

  // Restore persisted language & currency on app start
  initializeSettings: async () => {
    try {
      const [savedLanguage, savedCurrency] = await Promise.all([
        SecureStore.getItemAsync(LANGUAGE_KEY),
        SecureStore.getItemAsync(CURRENCY_KEY),
      ]);

      if (savedLanguage) {
        set({ language: savedLanguage });
        await i18n.changeLanguage(savedLanguage);
      }

      if (savedCurrency) {
        set({ currency: savedCurrency });
      }
    } catch {
      // Ignore errors — use defaults
    }
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

  // Persist currency to SecureStore + update state
  setDefaultCurrency: (currency) => {
    set({ currency });
    SecureStore.setItemAsync(CURRENCY_KEY, currency).catch(() => {});
  },

  // Persist language to SecureStore + change i18n + update state
  setLanguage: (lang) => {
    set({ language: lang });
    i18n.changeLanguage(lang);
    SecureStore.setItemAsync(LANGUAGE_KEY, lang).catch(() => {});
  },
}));
