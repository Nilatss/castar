/**
 * CaStar — Navigation type definitions
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  BudgetTab: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  TransactionDetail: { transactionId: string };
  AddTransaction: { type?: 'income' | 'expense' } | undefined;
};

export type BudgetStackParamList = {
  Budgets: undefined;
  BudgetDetail: { budgetId: string };
  CreateBudget: undefined;
  FamilyBudget: { groupId: string };
};

export type AnalyticsStackParamList = {
  Analytics: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Categories: undefined;
  CreateCategory: undefined;
};
