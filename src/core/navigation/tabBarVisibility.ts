/**
 * Lightweight Zustand store for imperative tab bar visibility control.
 *
 * Screens call setHidden(true/false) when opening/closing modals.
 * CustomTabBar reads `hidden` and fades out via Animated (no unmount).
 *
 * Key principle: the tab bar is ALWAYS mounted — only opacity + pointerEvents change.
 * This avoids the unmount/remount cycle that causes layout recalculation lag.
 */
import { create } from 'zustand';

interface TabBarVisibilityState {
  hidden: boolean;
  setHidden: (val: boolean) => void;
}

export const useTabBarVisibility = create<TabBarVisibilityState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}));
