import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Button, Input, SegmentedControl, CategoryIcon } from '../../../shared/components';
import { useCategoryStore } from '../store/categoryStore';
import { useAuthStore } from '../../auth/store/authStore';
import { createCategorySchema } from '../../../shared/services/validation';

const ICON_OPTIONS = [
  '🍔', '🚗', '🏠', '💡', '🎮', '💊', '📚', '👕',
  '🎁', '💼', '💻', '📈', '🛒', '✈️', '🎬', '☕',
];

const COLOR_OPTIONS = [
  '#F55858', '#4B8DF5', '#FAAD14', '#17E56C', '#CC830C',
  '#1D62E5', '#E52222', '#F03D3D', '#09AD4D', '#0FC95C',
  '#808080', '#9B59B6', '#E67E22', '#1ABC9C',
];

export const CreateCategoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const userId = useAuthStore((s) => s.userId);
  const { addCategory } = useCategoryStore();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState('#4B8DF5');
  const [typeIndex, setTypeIndex] = useState(0);
  const type = typeIndex === 0 ? 'expense' : 'income';

  const handleSave = () => {
    if (!userId) return;

    const dto = {
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: type as 'income' | 'expense',
    };

    const result = createCategorySchema.safeParse(dto);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? 'Validation error';
      Alert.alert(t('common.error'), firstError);
      return;
    }

    addCategory(result.data, userId);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('categories.createCategory')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <CategoryIcon icon={selectedIcon} color={selectedColor} size="lg" />
        <Text style={styles.previewName}>{name || t('categories.newCategory')}</Text>
      </View>

      {/* Type */}
      <SegmentedControl
        options={[t('transactions.expense'), t('transactions.income')]}
        selectedIndex={typeIndex}
        onChange={setTypeIndex}
      />

      {/* Name */}
      <Input
        label={t('categories.categoryName')}
        placeholder={t('categories.namePlaceholder')}
        value={name}
        onChangeText={setName}
        containerStyle={styles.inputContainer}
      />

      {/* Icon Picker */}
      <Text style={styles.sectionLabel}>{t('categories.icon')}</Text>
      <View style={styles.grid}>
        {ICON_OPTIONS.map((icon) => (
          <TouchableOpacity
            key={icon}
            onPress={() => setSelectedIcon(icon)}
            style={[
              styles.iconOption,
              selectedIcon === icon && styles.iconOptionActive,
            ]}
          >
            <Text style={styles.iconText}>{icon}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Color Picker */}
      <Text style={styles.sectionLabel}>{t('categories.color')}</Text>
      <View style={styles.grid}>
        {COLOR_OPTIONS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => setSelectedColor(color)}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.colorOptionActive,
            ]}
          />
        ))}
      </View>

      {/* Save */}
      <Button
        title={t('common.save')}
        onPress={handleSave}
        fullWidth
        size="lg"
        disabled={!name.trim()}
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
  preview: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  previewName: {
    ...typography.heading4,
    color: colors.text,
  },
  inputContainer: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.smallMedium,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.white[50],
  },
  iconText: {
    fontSize: 22,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: colors.white[100],
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
