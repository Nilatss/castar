import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { colors } from '../../shared/constants';
import { getDatabase, runMigrations, seedDefaults } from '../../shared/services/database';
import { useAuthStore } from '../../features/auth/store/authStore';

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

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const migrationsRan = useRef(false);
  const userId = useAuthStore((s) => s.userId);

  // Run migrations once on mount
  useEffect(() => {
    if (!migrationsRan.current) {
      const db = getDatabase();
      runMigrations(db);
      migrationsRan.current = true;
    }
  }, []);

  // Seed defaults when userId becomes available
  useEffect(() => {
    if (userId) {
      const db = getDatabase();
      seedDefaults(db, userId);
    }
  }, [userId]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {children}
    </NavigationContainer>
  );
};
