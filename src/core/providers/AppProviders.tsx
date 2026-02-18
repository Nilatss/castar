import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationState } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../../shared/constants';
import { useAuthStore } from '../../features/auth/store/authStore';

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
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | undefined>();

  // Restore auth + navigation state in parallel on app start
  useEffect(() => {
    const init = async () => {
      try {
        const [, savedNav] = await Promise.all([
          initializeAuth(),
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
  }, [initializeAuth]);

  // Persist navigation state on every change
  const onStateChange = useCallback((state: NavigationState | undefined) => {
    if (state) {
      SecureStore.setItemAsync(NAV_STATE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {children}
    </NavigationContainer>
  );
};
