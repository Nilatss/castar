import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { CategoryIcon, SegmentedControl, EmptyState } from '../../../shared/components';
import { useCategoryStore } from '../store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import type { ProfileStackParamList } from '../../../shared/types/navigation';
import type { Category } from '../../../shared/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export const CategoriesScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.userId);
  const { categories, loadCategories } = useCategoryStore();
  const [typeIndex, setTypeIndex] = useState(0);
  const type = typeIndex === 0 ? 'expense' : 'income';

  useFocusEffect(
    useCallback(() => {
      if (userId) loadCategories(userId);
    }, [userId, loadCategories])
  );

  const filtered = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const customCount = useMemo(
    () => categories.filter((c) => !c.isDefault).length,
    [categories]
  );

  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <View style={styles.categoryItem}>
        <CategoryIcon icon={item.icon} color={item.color} size="md" />
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {item.isDefault && (
            <Text style={styles.defaultBadge}>{t('categories.default')}</Text>
          )}
        </View>
      </View>
    ),
    [t]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.categories')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Type Selector */}
      <SegmentedControl
        options={[t('transactions.expense'), t('transactions.income')]}
        selectedIndex={typeIndex}
        onChange={setTypeIndex}
      />

      {/* Tier Info */}
      <Text style={styles.tierText}>
        {customCount}/5 {t('categories.custom')}
      </Text>

      {/* Categories List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={t('categories.noCategories')}
          actionLabel={t('categories.createCategory')}
          onAction={() => navigation.navigate('CreateCategory')}
        />
      ) : (
        <FlatList
          data={filtered}
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
        onPress={() => navigation.navigate('CreateCategory')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    ...typography.heading5,
    color: colors.text,
  },
  tierText: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  list: {
    paddingBottom: 100,
    gap: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  defaultBadge: {
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
