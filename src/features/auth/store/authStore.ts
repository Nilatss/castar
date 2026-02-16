import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  token: string | null;
  userId: string | null;

  setOnboarded: (value: boolean) => void;
  setAuthenticated: (token: string, userId: string) => void;
  logout: () => void;
  skipAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isOnboarded: false,
  token: null,
  userId: null,

  setOnboarded: (value) => set({ isOnboarded: value }),

  setAuthenticated: (token, userId) =>
    set({ isAuthenticated: true, isOnboarded: true, token, userId }),

  logout: () =>
    set({ isAuthenticated: false, token: null, userId: null }),

  skipAuth: () =>
    set({ isOnboarded: true }),
}));
