import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Button, Input, SegmentedControl, CategoryIcon } from '../../../shared/components';
import { useBudgetStore } from '../store/budgetStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import { createBudgetSchema } from '../../../shared/services/validation';
import type { Category } from '../../../shared/types';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export const CreateBudgetScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const userId = useAuthStore((s) => s.userId);
  const { addBudget } = useBudgetStore();
  const { categories, loadCategories } = useCategoryStore();

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [periodIndex, setPeriodIndex] = useState(2); // monthly default
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (userId) loadCategories(userId);
    }, [userId, loadCategories])
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const handleSave = () => {
    if (!userId) return;

    const amount = parseFloat(amountStr);
    const dto = {
      name: name.trim(),
      amount,
      currency: 'UZS' as const,
      period: PERIODS[periodIndex],
      startDate: Date.now(),
      categoryId: selectedCategoryId ?? undefined,
    };

    const result = createBudgetSchema.safeParse(dto);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? 'Validation error';
      Alert.alert(t('common.error'), firstError);
      return;
    }

    addBudget(result.data, userId);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('budget.createBudget')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Name */}
      <Input
        label={t('budget.budgetName')}
        placeholder={t('budget.namePlaceholder')}
        value={name}
        onChangeText={setName}
      />

      {/* Amount */}
      <Input
        label={t('budget.limit')}
        placeholder="0"
        value={amountStr}
        onChangeText={setAmountStr}
        keyboardType="numeric"
      />

      {/* Period */}
      <Text style={styles.sectionLabel}>{t('budget.period')}</Text>
      <SegmentedControl
        options={PERIODS.map((p) => t(`budget.${p}`))}
        selectedIndex={periodIndex}
        onChange={setPeriodIndex}
      />

      {/* Category */}
      <Text style={styles.sectionLabel}>{t('transactions.category')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          {expenseCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={[
                styles.categoryItem,
                selectedCategoryId === cat.id && styles.categoryItemActive,
              ]}
            >
              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Save */}
      <Button
        title={t('common.save')}
        onPress={handleSave}
        fullWidth
        size="lg"
        disabled={!name.trim() || !amountStr}
        style={styles.saveButton}
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
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    ...typography.heading5,
    color: colors.text,
  },
  sectionLabel: {
    ...typography.smallMedium,
    color: colors.textSecondary,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    minWidth: 64,
  },
  categoryItemActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.white[30],
  },
  categoryName: {
    ...typography.caption,
    color: colors.textSecondary,
    maxWidth: 56,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
