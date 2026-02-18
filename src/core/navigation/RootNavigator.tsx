import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../shared/types';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { PinLockScreen } from '../../features/auth/screens/PinLockScreen';
import { useAuthStore } from '../../features/auth/store/authStore';
import { colors } from '../../shared/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isOnboarded = useAuthStore((s) => s.isOnboarded);
  const isPinVerified = useAuthStore((s) => s.isPinVerified);
  const hasPin = useAuthStore((s) => s.hasPin);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Show loading screen while checking SecureStore for persisted session
  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={colors.white[100]} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboarded ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : hasPin && !isPinVerified ? (
        <Stack.Screen name="PinLock" component={PinLockScreen} />
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
