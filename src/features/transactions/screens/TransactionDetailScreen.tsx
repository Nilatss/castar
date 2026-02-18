import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '../../../shared/constants';
import { Card, CategoryIcon, Button } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatTransactionDate, formatTime } from '../../../shared/utils/formatDate';
import { useTransactionStore } from '../store/transactionStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import { transactionRepository } from '../../../shared/services/database';
import type { HomeStackParamList } from '../../../shared/types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'TransactionDetail'>;
type Route = RouteProp<HomeStackParamList, 'TransactionDetail'>;

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export const TransactionDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { transactionId } = route.params;
  const { removeTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();

  const transaction = useMemo(
    () => transactionRepository.findById(transactionId),
    [transactionId]
  );

  const category = useMemo(
    () => categories.find((c) => c.id === transaction?.categoryId),
    [categories, transaction?.categoryId]
  );

  if (!transaction) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('transactions.notFound')}</Text>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? colors.success[500] : colors.error[500];

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            removeTransaction(transaction.id);
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
        <Text style={styles.headerTitle}>{t('transactions.detail')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Amount + Category */}
      <View style={styles.amountSection}>
        {category && (
          <CategoryIcon icon={category.icon} color={category.color} size="lg" />
        )}
        <Text style={[styles.amountText, { color: amountColor }]}>
          {sign}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <Text style={styles.categoryName}>
          {category?.name ?? t('categories.other_expense')}
        </Text>
      </View>

      {/* Details */}
      <Card style={styles.card}>
        <DetailRow
          label={t('transactions.type')}
          value={isIncome ? t('transactions.income') : t('transactions.expense')}
        />
        <View style={styles.divider} />
        <DetailRow
          label={t('transactions.date')}
          value={formatTransactionDate(transaction.date, i18n.language)}
        />
        <View style={styles.divider} />
        <DetailRow
          label={t('transactions.time')}
          value={formatTime(transaction.date)}
        />
        <View style={styles.divider} />
        <DetailRow
          label={t('transactions.currency')}
          value={transaction.currency}
        />
        {transaction.description && (
          <>
            <View style={styles.divider} />
            <DetailRow
              label={t('transactions.description')}
              value={transaction.description}
            />
          </>
        )}
      </Card>

      {/* Delete Button */}
      <Button
        title={t('common.delete')}
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
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  amountText: {
    ...typography.heading1,
    marginTop: spacing.md,
  },
  categoryName: {
    ...typography.body,
    color: colors.textTertiary,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textTertiary,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing['2xl'],
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
