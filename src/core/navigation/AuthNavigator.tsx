import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../shared/types';
import { OnboardingScreen } from '../../features/auth/screens/OnboardingScreen';
import { TermsScreen } from '../../features/auth/screens/TermsScreen';
import { PrivacyPolicyScreen } from '../../features/auth/screens/PrivacyPolicyScreen';
import { TelegramAuthScreen } from '../../features/auth/screens/TelegramAuthScreen';
import { SetNameScreen } from '../../features/auth/screens/SetNameScreen';
import { SetPinScreen } from '../../features/auth/screens/SetPinScreen';
import { EmailAuthScreen } from '../../features/auth/screens/EmailAuthScreen';
import { EmailVerifyScreen } from '../../features/auth/screens/EmailVerifyScreen';
import { PhoneAuthScreen } from '../../features/auth/screens/PhoneAuthScreen';
import { PhoneVerifyScreen } from '../../features/auth/screens/PhoneVerifyScreen';
import { useAuthStore } from '../../features/auth/store/authStore';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const displayName = useAuthStore((s) => s.displayName);
  const hasPin = useAuthStore((s) => s.hasPin);

  // Determine initial route based on auth state:
  // - Has auth + displayName but no PIN → go to SetPin
  // - Has auth but no displayName → go to SetName
  // - Otherwise → Onboarding
  let initialRoute: keyof AuthStackParamList = 'Onboarding';
  if (isAuthenticated && displayName && !hasPin) {
    initialRoute = 'SetPin';
  } else if (isAuthenticated && !displayName) {
    initialRoute = 'SetName';
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 150,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="TermsOfUse"
        component={TermsScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 350,
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 350,
        }}
      />
      <Stack.Screen name="TelegramAuth" component={TelegramAuthScreen} />
      <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
      <Stack.Screen name="EmailVerify" component={EmailVerifyScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="PhoneVerify" component={PhoneVerifyScreen} />
      <Stack.Screen name="SetName" component={SetNameScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
    </Stack.Navigator>
  );
};
