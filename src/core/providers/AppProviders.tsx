import React, { useCallback, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { colors } from '../../shared/constants';
import { runMigrations, seedDefaults } from '../../shared/services/database';
import { useAuthStore } from '../../features/auth/store/authStore';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '../../shared/services/analytics/posthog';

// Initialize i18n
import '../../shared/i18n';

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

/**
 * Extract the active route name from a nested navigation state.
 */
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

/**
 * Inner component that has access to PostHog context for screen tracking.
 * React Navigation v7 requires manual screen capture via onStateChange.
 */
const NavigationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const posthog = usePostHog();
  const routeNameRef = useRef<string | undefined>(undefined);

  const onStateChange = useCallback(
    (state: NavigationState | undefined) => {
      const currentRouteName = getActiveRouteName(state);
      if (currentRouteName && currentRouteName !== routeNameRef.current) {
        posthog.screen(currentRouteName);
      }
      routeNameRef.current = currentRouteName;
    },
    [posthog],
  );

  return (
    <NavigationContainer theme={navigationTheme} onStateChange={onStateChange}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {children}
    </NavigationContainer>
  );
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const migrationsRan = useRef(false);
  const userId = useAuthStore((s) => s.userId);

  // Run migrations once on mount
  useEffect(() => {
    if (!migrationsRan.current) {
      runMigrations();
      migrationsRan.current = true;
    }
  }, []);

  // Seed defaults when userId becomes available
  useEffect(() => {
    if (userId) {
      seedDefaults(userId);
    }
  }, [userId]);

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
      }}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
    >
      <NavigationWrapper>
        {children}
      </NavigationWrapper>
    </PostHogProvider>
  );
};
