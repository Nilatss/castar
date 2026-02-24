import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationState } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { QueryClientProvider } from '@tanstack/react-query';
import { colors } from '../../shared/constants';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useProfileStore } from '../../features/profile/store/profileStore';
import { queryClient } from '../../shared/services/api/queryClient';
import { initEncryptedDb } from '../../shared/services/database/connection';

// Initialize i18n
import '../../shared/i18n';

const NAV_STATE_KEY = 'castar_nav_state';

interface AppProvidersProps {
  children: React.ReactNode;
}

const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.white[100],
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.error[500],
  },
  fonts: {
    regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' as const },
    medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' as const },
    bold: { fontFamily: 'Inter_700Bold', fontWeight: '700' as const },
    heavy: { fontFamily: 'Inter_700Bold', fontWeight: '700' as const },
  },
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const initializeSettings = useProfileStore((s) => s.initializeSettings);
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | undefined>();

  // Restore auth + settings + navigation state in parallel on app start
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize encrypted SQLite DB FIRST — auth/settings may depend on it
        await initEncryptedDb();

        const [, , savedNav] = await Promise.all([
          initializeAuth(),
          initializeSettings(),
          SecureStore.getItemAsync(NAV_STATE_KEY),
        ]);
        if (savedNav) {
          setInitialState(JSON.parse(savedNav));
        }
      } catch {
        // Ignore errors — start fresh
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, [initializeAuth, initializeSettings]);

  // Persist navigation state (debounced — avoids writing on every tab switch)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onStateChange = useCallback((state: NavigationState | undefined) => {
    if (state) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        SecureStore.setItemAsync(NAV_STATE_KEY, JSON.stringify(state)).catch(() => {});
      }, 1000);
    }
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer
        theme={navigationTheme}
        initialState={initialState}
        onStateChange={onStateChange}
      >
        <StatusBar style="light" translucent backgroundColor="transparent" />
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};
