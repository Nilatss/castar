import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import i18n, { ensureLanguageLoaded } from '../../../shared/i18n';
import type { User, AppSettings, Currency } from '../../../shared/types';

// ═══════════════════════════════════════════════
// SecureStore keys
// ═══════════════════════════════════════════════

const LANGUAGE_KEY = 'castar_language';
const CURRENCY_KEY = 'castar_currency';
const BIOMETRIC_KEY = 'castar_biometric_lock';

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
  setBiometricLock: (enabled: boolean) => void;
}

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

export const useProfileStore = create<ProfileStore>((set) => ({
  user: null,
  settings: {
    theme: 'dark',
    notifications: true,
    biometricLock: true,
  },
  language: i18n.language || 'en',
  currency: 'UZS',

  // Restore persisted language, currency & biometric on app start
  initializeSettings: async () => {
    try {
      const [savedLanguage, savedCurrency, savedBiometric] = await Promise.all([
        SecureStore.getItemAsync(LANGUAGE_KEY),
        SecureStore.getItemAsync(CURRENCY_KEY),
        SecureStore.getItemAsync(BIOMETRIC_KEY),
      ]);

      const updates: Partial<Pick<ProfileStore, 'language' | 'currency'>> = {};

      if (savedLanguage) {
        updates.language = savedLanguage;
        ensureLanguageLoaded(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      }

      if (savedCurrency) {
        updates.currency = savedCurrency;
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
      }

      // Restore biometric setting into settings object
      if (savedBiometric === 'true') {
        set((state) => ({
          settings: { ...state.settings, biometricLock: true },
        }));
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

  // Persist language to SecureStore + lazy-load bundle + change i18n + update state
  setLanguage: (lang) => {
    set({ language: lang });
    ensureLanguageLoaded(lang);
    i18n.changeLanguage(lang);
    SecureStore.setItemAsync(LANGUAGE_KEY, lang).catch(() => {});
  },

  // Persist biometric lock setting to SecureStore + update state
  setBiometricLock: (enabled) => {
    set((state) => ({
      settings: { ...state.settings, biometricLock: enabled },
    }));
    SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled)).catch(() => {});
  },
}));
