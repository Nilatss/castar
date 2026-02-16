import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '../../../shared/constants';

export const HomeScreen = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('tabs.home')}</Text>
      <Text style={styles.balance}>{t('home.balance')}</Text>
      <Text style={styles.amount}>0 UZS</Text>
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
    ...typography.heading4,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  balance: {
    ...typography.body,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  amount: {
    ...typography.heading1,
    color: colors.text,
  },
});
