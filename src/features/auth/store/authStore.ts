import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  token: string | null;
  userId: string | null;
  displayName: string | null;

  setOnboarded: (value: boolean) => void;
  setAuthenticated: (token: string, userId: string, displayName?: string) => void;
  setDisplayName: (name: string) => void;
  logout: () => void;
  skipAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isOnboarded: false,
  token: null,
  userId: null,
  displayName: null,

  setOnboarded: (value) => set({ isOnboarded: value }),

  setAuthenticated: (token, userId, displayName) =>
    set({ isAuthenticated: true, isOnboarded: true, token, userId, displayName: displayName ?? null }),

  setDisplayName: (name) => set({ displayName: name }),

  logout: () =>
    set({ isAuthenticated: false, token: null, userId: null, displayName: null }),

  skipAuth: () =>
    set({ isOnboarded: true }),
}));
