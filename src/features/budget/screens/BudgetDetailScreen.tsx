import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '../../../shared/constants';
import { Card, ProgressBar, CategoryIcon, Button } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { useBudgetStore } from '../store/budgetStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import type { BudgetStackParamList } from '../../../shared/types/navigation';

type Nav = NativeStackNavigationProp<BudgetStackParamList, 'BudgetDetail'>;
type Route = RouteProp<BudgetStackParamList, 'BudgetDetail'>;

export const BudgetDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { budgetId } = route.params;
  const { budgets, removeBudget } = useBudgetStore();
  const { categories } = useCategoryStore();

  const budget = useMemo(
    () => budgets.find((b) => b.id === budgetId),
    [budgets, budgetId]
  );

  const category = useMemo(
    () => budget?.categoryId ? categories.find((c) => c.id === budget.categoryId) : null,
    [categories, budget?.categoryId]
  );

  if (!budget) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('budget.notFound')}</Text>
        </View>
      </View>
    );
  }

  const percentage = budget.percentage ?? 0;
  const spent = budget.spent ?? 0;
  const remaining = budget.remaining ?? 0;
  const dailyAvg = (() => {
    const now = new Date();
    const start = new Date(budget.startDate);
    const days = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return spent / days;
  })();

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('budget.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            removeBudget(budget.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{budget.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Category + Progress */}
      <View style={styles.progressSection}>
        {category && (
          <CategoryIcon icon={category.icon} color={category.color} size="lg" />
        )}
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
        <ProgressBar percentage={percentage} height={10} style={styles.progressBar} />
        <Text style={styles.progressLabel}>
          {formatCurrency(spent, budget.currency, true)} / {formatCurrency(budget.amount, budget.currency, true)}
        </Text>
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('budget.limit')}</Text>
          <Text style={styles.statValue}>{formatCurrency(budget.amount, budget.currency)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('budget.spent')}</Text>
          <Text style={[styles.statValue, { color: colors.error[500] }]}>
            {formatCurrency(spent, budget.currency)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('budget.remaining')}</Text>
          <Text style={[styles.statValue, { color: colors.success[500] }]}>
            {formatCurrency(remaining, budget.currency)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('budget.dailyAvg')}</Text>
          <Text style={styles.statValue}>{formatCurrency(dailyAvg, budget.currency)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('budget.period')}</Text>
          <Text style={styles.statValue}>{t(`budget.${budget.period}`)}</Text>
        </View>
      </Card>

      {/* Status Message */}
      {percentage >= 100 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertText}>{t('budget.exceeded')}</Text>
        </View>
      )}
      {percentage >= 80 && percentage < 100 && (
        <View style={[styles.alertCard, { backgroundColor: colors.warning[500] + '20' }]}>
          <Text style={[styles.alertText, { color: colors.warning[500] }]}>
            {t('budget.warning')}
          </Text>
        </View>
      )}

      {/* Delete */}
      <Button
        title={t('budget.deleteBudget')}
        onPress={handleDelete}
        variant="danger"
        fullWidth
        style={styles.deleteButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    ...typography.heading5,
    color: colors.text,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  percentageText: {
    ...typography.heading1,
    color: colors.text,
  },
  progressBar: {
    width: '100%',
  },
  progressLabel: {
    ...typography.body,
    color: colors.textTertiary,
  },
  statsCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  statLabel: {
    ...typography.body,
    color: colors.textTertiary,
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  alertCard: {
    backgroundColor: colors.error[500] + '20',
    padding: spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  alertText: {
    ...typography.bodyMedium,
    color: colors.error[500],
  },
  deleteButton: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
