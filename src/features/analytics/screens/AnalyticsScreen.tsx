import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Card, SegmentedControl, ProgressBar, CategoryIcon } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { useTransactionStore } from '../../transactions/store/transactionStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import { transactionRepository } from '../../../shared/services/database';
import type { Transaction, Category } from '../../../shared/types';

const PERIODS = ['week', 'month', 'quarter', 'year'] as const;

function getDateRange(period: string): { from: number; to: number } {
  const now = new Date();
  const to = now.getTime();
  switch (period) {
    case 'week': {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: from.getTime(), to };
    }
    case 'quarter': {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      return { from: from.getTime(), to };
    }
    case 'year': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: from.getTime(), to };
    }
    default: { // month
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.getTime(), to };
    }
  }
}

export const AnalyticsScreen = () => {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.userId);
  const { transactions, loadTransactions } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const [periodIndex, setPeriodIndex] = useState(1);
  const period = PERIODS[periodIndex];

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadTransactions(userId);
        loadCategories(userId);
      }
    }, [userId, loadTransactions, loadCategories])
  );

  const { from, to } = useMemo(() => getDateRange(period), [period]);

  const summary = useMemo(() => {
    if (!userId) return { income: 0, expense: 0, balance: 0 };
    const s = transactionRepository.getSummary(userId, from, to);
    return { income: s.income, expense: s.expense, balance: s.income - s.expense };
  }, [userId, from, to, transactions]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const filtered = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date >= from && tx.date <= to
    );
    const totals = new Map<string, number>();
    for (const tx of filtered) {
      totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
    }

    const catMap = new Map<string, Category>();
    for (const cat of categories) catMap.set(cat.id, cat);

    return Array.from(totals, ([catId, amount]) => ({
      category: catMap.get(catId),
      amount,
      percentage: summary.expense > 0 ? (amount / summary.expense) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, from, to, summary.expense]);

  const savingsRate = summary.income > 0
    ? Math.round(((summary.income - summary.expense) / summary.income) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('analytics.title')}</Text>

      <SegmentedControl
        options={PERIODS.map((p) => t(`analytics.${p}`))}
        selectedIndex={periodIndex}
        onChange={setPeriodIndex}
      />

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('home.income')}</Text>
            <Text style={[styles.summaryValue, { color: colors.success[500] }]}>
              +{formatCurrency(summary.income, 'UZS', true)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('home.expense')}</Text>
            <Text style={[styles.summaryValue, { color: colors.error[500] }]}>
              -{formatCurrency(summary.expense, 'UZS', true)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('home.balance')}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.balance, 'UZS', true)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('analytics.savingsRate')}</Text>
            <Text style={styles.summaryValue}>{savingsRate}%</Text>
          </View>
        </View>
      </Card>

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>{t('analytics.byCategory')}</Text>
      {categoryBreakdown.map((item) => (
        <View key={item.category?.id ?? 'unknown'} style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            {item.category && (
              <CategoryIcon icon={item.category.icon} color={item.category.color} size="sm" />
            )}
            <Text style={styles.categoryName}>{item.category?.name ?? '?'}</Text>
          </View>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryAmount}>
              {formatCurrency(item.amount, 'UZS', true)}
            </Text>
            <ProgressBar percentage={item.percentage} style={styles.categoryBar} />
          </View>
        </View>
      ))}

      {categoryBreakdown.length === 0 && (
        <Text style={styles.emptyText}>{t('analytics.noData')}</Text>
      )}
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
    gap: spacing.lg,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
  },
  summaryCard: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    ...typography.heading5,
    color: colors.text,
    marginTop: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
  },
  categoryRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    width: 120,
  },
  categoryAmount: {
    ...typography.smallMedium,
    color: colors.text,
  },
  categoryBar: {
    width: '100%',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
