import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '../../../shared/constants';

export const BudgetsScreen = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('budget.title')}</Text>
      <Text style={styles.empty}>{t('budget.noBudgets')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: 24,
  },
  empty: {
    ...typography.bodyLarge,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 100,
  },
});
