import { create } from 'zustand';
import type { TelegramUser } from '../services/telegramAuth';
import * as SecureStore from 'expo-secure-store';
import {
  persistAuth,
  persistEmailAuth,
  persistPhoneAuth,
  clearAuth,
  loadPersistedAuth,
  persistDisplayName,
  getPersistedDisplayName,
  persistPin,
  getPersistedPin,
} from '../services/telegramAuth';

interface AuthStore {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  /** Whether PIN has been verified this session (resets on app restart) */
  isPinVerified: boolean;
  token: string | null;
  userId: string | null;
  telegramUser: TelegramUser | null;
  /** Display name entered on SetName screen (persists across logout) */
  displayName: string | null;
  /** Whether PIN has been set */
  hasPin: boolean;

  /** Check SecureStore for existing session on app start */
  initializeAuth: () => Promise<void>;

  /** Save Telegram auth data and mark as authenticated */
  loginWithTelegram: (token: string, user: TelegramUser) => Promise<void>;

  /** Save email auth data and mark as authenticated */
  loginWithEmail: (token: string, email: string) => Promise<void>;

  /** Save phone auth data and mark as authenticated */
  loginWithPhone: (token: string, phone: string) => Promise<void>;

  /** Save display name (called from SetNameScreen) — navigates to SetPin */
  setDisplayNameAndContinue: (name: string) => Promise<void>;

  /** Save PIN code (called from SetPinScreen) and proceed to Main */
  setPinAndContinue: (pin: string) => Promise<void>;

  /** Verify PIN against saved PIN (called from PinLockScreen) */
  verifyPin: (pin: string) => Promise<boolean>;

  setOnboarded: (value: boolean) => void;
  setAuthenticated: (token: string, userId: string) => void;

  /** Clear session but keep display name (returning user remembered) */
  logout: () => Promise<void>;

  skipAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isOnboarded: false,
  isLoading: true,
  isPinVerified: false,
  token: null,
  userId: null,
  telegramUser: null,
  displayName: null,
  hasPin: false,

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const [persisted, displayName, pin] = await Promise.all([
        loadPersistedAuth(),
        getPersistedDisplayName(),
        getPersistedPin(),
      ]);

      if (persisted) {
        // Only mark as onboarded if user has completed both SetName AND SetPin
        const hasCompletedSetup = !!displayName && !!pin;
        set({
          isAuthenticated: true,
          isOnboarded: hasCompletedSetup,
          token: persisted.token,
          userId: persisted.user.id,
          telegramUser: persisted.user,
          displayName,
          hasPin: !!pin,
          isLoading: false,
        });
      } else {
        set({ displayName, hasPin: !!pin, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  loginWithTelegram: async (token, user) => {
    await persistAuth(token, user);

    // Check if this is a returning user (has saved display name AND PIN)
    const [savedName, savedPin] = await Promise.all([
      getPersistedDisplayName(),
      getPersistedPin(),
    ]);

    if (savedName && savedPin) {
      // Returning user — skip SetName & SetPin, go straight to Main
      set({
        isAuthenticated: true,
        isOnboarded: true,
        token,
        userId: user.id,
        telegramUser: user,
        displayName: savedName,
        hasPin: true,
      });
    } else {
      // First-time or incomplete setup — needs to go through SetName/SetPin
      set({
        isAuthenticated: true,
        // Don't set isOnboarded yet — user goes through setup screens first
        token,
        userId: user.id,
        telegramUser: user,
        displayName: savedName,
        hasPin: !!savedPin,
      });
    }
  },

  loginWithEmail: async (token, email) => {
    await persistEmailAuth(token, email);

    // Check if this is a returning user (has saved display name AND PIN)
    const [savedName, savedPin] = await Promise.all([
      getPersistedDisplayName(),
      getPersistedPin(),
    ]);

    if (savedName && savedPin) {
      // Returning user — skip SetName & SetPin, go straight to Main
      set({
        isAuthenticated: true,
        isOnboarded: true,
        token,
        userId: email,
        displayName: savedName,
        hasPin: true,
      });
    } else {
      // First-time or incomplete setup — needs to go through SetName/SetPin
      set({
        isAuthenticated: true,
        token,
        userId: email,
        displayName: savedName,
        hasPin: !!savedPin,
      });
    }
  },

  loginWithPhone: async (token, phone) => {
    await persistPhoneAuth(token, phone);

    // Check if this is a returning user (has saved display name AND PIN)
    const [savedName, savedPin] = await Promise.all([
      getPersistedDisplayName(),
      getPersistedPin(),
    ]);

    if (savedName && savedPin) {
      // Returning user — skip SetName & SetPin, go straight to Main
      set({
        isAuthenticated: true,
        isOnboarded: true,
        token,
        userId: phone,
        displayName: savedName,
        hasPin: true,
      });
    } else {
      // First-time or incomplete setup — needs to go through SetName/SetPin
      set({
        isAuthenticated: true,
        token,
        userId: phone,
        displayName: savedName,
        hasPin: !!savedPin,
      });
    }
  },

  setDisplayNameAndContinue: async (name) => {
    await persistDisplayName(name);
    // Don't set isOnboarded yet — user still needs to set PIN
    set({ displayName: name });
  },

  setPinAndContinue: async (pin) => {
    await persistPin(pin);
    // Clear saved auth navigation state — user completed setup, no need to restore auth screens
    await SecureStore.deleteItemAsync('castar_nav_state').catch(() => {});
    set({ hasPin: true, isOnboarded: true, isPinVerified: true });
  },

  verifyPin: async (pin) => {
    const savedPin = await getPersistedPin();
    if (savedPin && pin === savedPin) {
      set({ isPinVerified: true });
      return true;
    }
    return false;
  },

  setOnboarded: (value) => set({ isOnboarded: value }),

  setAuthenticated: (token, userId) =>
    set({ isAuthenticated: true, isOnboarded: true, token, userId }),

  logout: async () => {
    await clearAuth();
    // Clear saved navigation state so user starts fresh at Onboarding
    await SecureStore.deleteItemAsync('castar_nav_state').catch(() => {});
    // Keep displayName in state and SecureStore — returning user will be remembered
    set({
      isAuthenticated: false,
      isOnboarded: false,
      isPinVerified: false,
      token: null,
      userId: null,
      telegramUser: null,
      // displayName intentionally NOT cleared
    });
  },

  skipAuth: () =>
    set({ isOnboarded: true, isLoading: false }),
}));
