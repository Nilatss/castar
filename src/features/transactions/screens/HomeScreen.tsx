import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Card, TransactionItem, EmptyState } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatTransactionDate } from '../../../shared/utils/formatDate';
import { useTransactionStore } from '../store/transactionStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import { transactionRepository } from '../../../shared/services/database';
import type { HomeStackParamList } from '../../../shared/types/navigation';
import type { Transaction } from '../../../shared/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type FlatItem = { type: 'header'; title: string } | { type: 'item'; transaction: Transaction };

/** Group transactions by formatted date string. */
function groupByDate(transactions: Transaction[], lang: string): { title: string; data: Transaction[] }[] {
  const groups: Map<string, Transaction[]> = new Map();
  for (const tx of transactions) {
    const key = formatTransactionDate(tx.date, lang);
    const existing = groups.get(key);
    if (existing) {
      existing.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }
  return Array.from(groups, ([title, data]) => ({ title, data }));
}

export const HomeScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.userId);
  const { transactions, isLoading, loadTransactions } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadTransactions(userId);
        loadCategories(userId);
      }
    }, [userId, loadTransactions, loadCategories])
  );

  // Summary for current month
  const summary = useMemo(() => {
    if (!userId) return { income: 0, expense: 0, balance: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = now.getTime();
    const s = transactionRepository.getSummary(userId, monthStart, monthEnd);
    return { income: s.income, expense: s.expense, balance: s.income - s.expense };
  }, [userId, transactions]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    for (const cat of categories) {
      map.set(cat.id, { name: cat.name, icon: cat.icon, color: cat.color });
    }
    return map;
  }, [categories]);

  const flatData = useMemo(() => {
    const sections = groupByDate(transactions, i18n.language);
    const items: FlatItem[] = [];
    for (const section of sections) {
      items.push({ type: 'header', title: section.title });
      for (const tx of section.data) {
        items.push({ type: 'item', transaction: tx });
      }
    }
    return items;
  }, [transactions, i18n.language]);

  const handleRefresh = useCallback(() => {
    if (userId) loadTransactions(userId);
  }, [userId, loadTransactions]);

  const renderItem = useCallback(
    ({ item }: { item: FlatItem }) => {
      if (item.type === 'header') {
        return <Text style={styles.sectionHeader}>{item.title}</Text>;
      }
      const tx = item.transaction;
      const cat = categoryMap.get(tx.categoryId);
      return (
        <TransactionItem
          icon={cat?.icon ?? '?'}
          iconColor={cat?.color ?? '#808080'}
          title={cat?.name ?? t('categories.other_expense')}
          subtitle={tx.description ?? undefined}
          amount={tx.amount}
          currency={tx.currency}
          type={tx.type}
          onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
        />
      );
    },
    [categoryMap, navigation, t]
  );

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('home.balance')}</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(summary.balance, 'UZS', true)}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.success[500] }]} />
            <Text style={styles.summaryLabel}>{t('home.income')}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.income, 'UZS', true)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.error[500] }]} />
            <Text style={styles.summaryLabel}>{t('home.expense')}</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.expense, 'UZS', true)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Transaction List or Empty State */}
      {flatData.length === 0 && !isLoading ? (
        <EmptyState
          title={t('home.no_transactions')}
          description={t('home.no_transactions_desc')}
          actionLabel={t('home.add_first')}
          onAction={() => navigation.navigate('AddTransaction')}
        />
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `h-${index}` : `t-${item.transaction.id}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.white[100]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddTransaction')}
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
  },
  balanceCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.base,
    padding: spacing.lg,
  },
  balanceLabel: {
    ...typography.body,
    color: colors.textTertiary,
  },
  balanceAmount: {
    ...typography.heading1,
    color: colors.text,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.base,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  summaryValue: {
    ...typography.smallMedium,
    color: colors.text,
  },
  sectionHeader: {
    ...typography.smallMedium,
    color: colors.textTertiary,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
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
