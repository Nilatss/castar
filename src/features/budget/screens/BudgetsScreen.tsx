import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Card, ProgressBar, CategoryIcon, EmptyState } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { useBudgetStore } from '../store/budgetStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import type { BudgetStackParamList } from '../../../shared/types/navigation';
import type { Budget } from '../../../shared/types';

type Nav = NativeStackNavigationProp<BudgetStackParamList>;

export const BudgetsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.userId);
  const { budgets, loadBudgets } = useBudgetStore();
  const { categories, loadCategories } = useCategoryStore();

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadBudgets(userId);
        loadCategories(userId);
      }
    }, [userId, loadBudgets, loadCategories])
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    for (const cat of categories) {
      map.set(cat.id, { name: cat.name, icon: cat.icon, color: cat.color });
    }
    return map;
  }, [categories]);

  const totalBudgeted = useMemo(
    () => budgets.reduce((sum, b) => sum + b.amount, 0),
    [budgets]
  );
  const totalSpent = useMemo(
    () => budgets.reduce((sum, b) => sum + (b.spent ?? 0), 0),
    [budgets]
  );

  const renderItem = useCallback(
    ({ item }: { item: Budget }) => {
      const cat = item.categoryId ? categoryMap.get(item.categoryId) : null;
      const percentage = item.percentage ?? 0;
      const spent = item.spent ?? 0;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('BudgetDetail', { budgetId: item.id })}
        >
          <Card style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              {cat && <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />}
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetName}>{item.name}</Text>
                <Text style={styles.budgetPeriod}>{t(`budget.${item.period}`)}</Text>
              </View>
              <Text style={styles.budgetAmount}>
                {formatCurrency(item.amount, item.currency, true)}
              </Text>
            </View>

            <ProgressBar percentage={percentage} />

            <View style={styles.budgetFooter}>
              <Text style={styles.spentText}>
                {t('budget.spent')}: {formatCurrency(spent, item.currency, true)}
              </Text>
              <Text style={styles.remainingText}>
                {t('budget.remaining')}: {formatCurrency(item.remaining ?? 0, item.currency, true)}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [categoryMap, navigation, t]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('budget.title')}</Text>

      {/* Summary */}
      {budgets.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('budget.totalBudgeted')}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalBudgeted, 'UZS', true)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('budget.totalSpent')}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalSpent, 'UZS', true)}</Text>
          </View>
        </View>
      )}

      {/* List */}
      {budgets.length === 0 ? (
        <EmptyState
          title={t('budget.noBudgets')}
          actionLabel={t('budget.createBudget')}
          onAction={() => navigation.navigate('CreateBudget')}
        />
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateBudget')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  summaryValue: {
    ...typography.heading5,
    color: colors.text,
  },
  list: {
    paddingBottom: 100,
    gap: spacing.md,
  },
  budgetCard: {
    padding: spacing.base,
    gap: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  budgetInfo: {
    flex: 1,
    gap: 2,
  },
  budgetName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  budgetPeriod: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  budgetAmount: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  remainingText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white[100],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.background,
    lineHeight: 30,
  },
});
