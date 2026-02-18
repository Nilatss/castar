import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Button, SegmentedControl, Card, CategoryIcon, Input } from '../../../shared/components';
import { useTransactionStore } from '../store/transactionStore';
import { useCategoryStore } from '../../categories/store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import { accountRepository } from '../../../shared/services/database';
import { createTransactionSchema } from '../../../shared/services/validation';
import type { HomeStackParamList } from '../../../shared/types/navigation';
import type { Category, Account } from '../../../shared/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AddTransaction'>;
type Route = RouteProp<HomeStackParamList, 'AddTransaction'>;

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const;

export const AddTransactionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const userId = useAuthStore((s) => s.userId);
  const { addTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();

  const initialType = route.params?.type === 'income' ? 1 : 0;
  const [typeIndex, setTypeIndex] = useState(initialType);
  const type = typeIndex === 0 ? 'expense' : 'income';

  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  // Filter categories by type
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // Get default account
  const defaultAccount = useMemo(() => {
    if (!userId) return null;
    const accounts = accountRepository.findByUser(userId);
    return accounts[0] ?? null;
  }, [userId]);

  const handleKeyPress = useCallback((key: string) => {
    setAmountStr((prev) => {
      if (key === 'del') {
        const next = prev.slice(0, -1);
        return next === '' ? '0' : next;
      }
      if (key === '.') {
        return prev.includes('.') ? prev : prev + '.';
      }
      // Limit decimal places to 2
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      // Limit total length
      if (prev.length >= 12) return prev;
      // Replace leading zero
      if (prev === '0' && key !== '.') return key;
      return prev + key;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!userId || !defaultAccount) return;

    const amount = parseFloat(amountStr);
    const dto = {
      accountId: defaultAccount.id,
      categoryId: selectedCategoryId ?? '',
      type: type as 'income' | 'expense',
      amount,
      currency: defaultAccount.currency,
      description: description.trim() || undefined,
      date: Date.now(),
    };

    const result = createTransactionSchema.safeParse(dto);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? 'Validation error';
      Alert.alert(t('common.error'), firstError);
      return;
    }

    addTransaction(result.data, userId);
    navigation.goBack();
  }, [userId, defaultAccount, amountStr, selectedCategoryId, type, description, addTransaction, navigation, t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home.addTransaction')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Type Selector */}
      <View style={styles.typeSelector}>
        <SegmentedControl
          options={[t('transactions.expense'), t('transactions.income')]}
          selectedIndex={typeIndex}
          onChange={setTypeIndex}
        />
      </View>

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>{amountStr}</Text>
        <Text style={styles.currencyText}>{defaultAccount?.currency ?? 'UZS'}</Text>
      </View>

      {/* Category Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryRow}>
          {filteredCategories.map((cat) => (
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

      {/* Description */}
      <Input
        placeholder={t('transactions.description')}
        value={description}
        onChangeText={setDescription}
        containerStyle={styles.descriptionContainer}
      />

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYPAD.map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => handleKeyPress(key)}
            activeOpacity={0.6}
            style={styles.keypadKey}
          >
            <Text style={styles.keypadText}>
              {key === 'del' ? '\u232B' : key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <Button
          title={t('common.save')}
          onPress={handleSave}
          fullWidth
          size="lg"
          disabled={amountStr === '0' || !selectedCategoryId}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    ...typography.heading5,
    color: colors.text,
  },
  typeSelector: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  amountText: {
    ...typography.heading1,
    color: colors.text,
    fontSize: 40,
    lineHeight: 48,
  },
  currencyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  categoryScroll: {
    maxHeight: 80,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
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
  descriptionContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  keypadKey: {
    width: '30%',
    aspectRatio: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  keypadText: {
    ...typography.heading3,
    color: colors.text,
  },
  saveContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    marginTop: 'auto',
    paddingBottom: 40,
  },
});
