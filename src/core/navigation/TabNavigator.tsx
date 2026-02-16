import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../shared/constants';
import {
  MainTabParamList,
  HomeStackParamList,
  BudgetStackParamList,
  AnalyticsStackParamList,
  ProfileStackParamList,
} from '../../shared/types';

// Screens
import { HomeScreen } from '../../features/transactions/screens/HomeScreen';
import { AddTransactionScreen } from '../../features/transactions/screens/AddTransactionScreen';
import { TransactionDetailScreen } from '../../features/transactions/screens/TransactionDetailScreen';
import { BudgetsScreen } from '../../features/budget/screens/BudgetsScreen';
import { BudgetDetailScreen } from '../../features/budget/screens/BudgetDetailScreen';
import { CreateBudgetScreen } from '../../features/budget/screens/CreateBudgetScreen';
import { FamilyBudgetScreen } from '../../features/budget/screens/FamilyBudgetScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { SettingsScreen } from '../../features/profile/screens/SettingsScreen';
import { CategoriesScreen } from '../../features/categories/screens/CategoriesScreen';
import { CreateCategoryScreen } from '../../features/categories/screens/CreateCategoryScreen';

// Stack Navigators
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BudgetStack = createNativeStackNavigator<BudgetStackParamList>();
const AnalyticsStack = createNativeStackNavigator<AnalyticsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
};

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={stackScreenOptions}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <HomeStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </HomeStack.Navigator>
);

const BudgetStackNavigator = () => (
  <BudgetStack.Navigator screenOptions={stackScreenOptions}>
    <BudgetStack.Screen name="Budgets" component={BudgetsScreen} />
    <BudgetStack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
    <BudgetStack.Screen name="CreateBudget" component={CreateBudgetScreen} />
    <BudgetStack.Screen name="FamilyBudget" component={FamilyBudgetScreen} />
  </BudgetStack.Navigator>
);

const AnalyticsStackNavigator = () => (
  <AnalyticsStack.Navigator screenOptions={stackScreenOptions}>
    <AnalyticsStack.Screen name="Analytics" component={AnalyticsScreen} />
  </AnalyticsStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackScreenOptions}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="Categories" component={CategoriesScreen} />
    <ProfileStack.Screen name="CreateCategory" component={CreateCategoryScreen} />
  </ProfileStack.Navigator>
);

// Tab Navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.white[100],
        tabBarInactiveTintColor: colors.white[40],
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter_500Medium',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetStackNavigator}
        options={{ tabBarLabel: t('tabs.budget') }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{ tabBarLabel: t('tabs.analytics') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
};
