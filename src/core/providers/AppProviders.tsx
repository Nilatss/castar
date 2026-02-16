import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { colors } from '../../shared/constants';

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
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {children}
    </NavigationContainer>
  );
};
