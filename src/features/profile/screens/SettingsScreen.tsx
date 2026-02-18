import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { colors, typography, spacing } from '../../../shared/constants';
import { Card } from '../../../shared/components';
import { useProfileStore } from '../store/profileStore';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
] as const;

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'] as const;

interface SettingRowProps {
  label: string;
  value: string;
  onPress?: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, value, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
    style={styles.settingRow}
  >
    <Text style={styles.settingLabel}>{label}</Text>
    <Text style={styles.settingValue}>{value}</Text>
  </TouchableOpacity>
);

export const SettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, setLanguage, setDefaultCurrency } = useProfileStore();

  const currentLang = i18next.language || 'uz';
  const currentCurrency = user?.defaultCurrency ?? 'UZS';

  const cycleLang = () => {
    const idx = LANGUAGES.findIndex((l) => l.code === currentLang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    i18next.changeLanguage(next.code);
    setLanguage(next.code as 'uz' | 'ru' | 'en');
  };

  const cycleCurrency = () => {
    const idx = CURRENCIES.indexOf(currentCurrency as typeof CURRENCIES[number]);
    const next = CURRENCIES[(idx + 1) % CURRENCIES.length];
    setDefaultCurrency(next);
  };

  const langLabel = LANGUAGES.find((l) => l.code === currentLang)?.label ?? currentLang;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <Card style={styles.card}>
        <SettingRow label={t('settings.language')} value={langLabel} onPress={cycleLang} />
        <View style={styles.divider} />
        <SettingRow label={t('settings.currency')} value={currentCurrency} onPress={cycleCurrency} />
        <View style={styles.divider} />
        <SettingRow label={t('settings.theme')} value={t('settings.dark')} />
        <View style={styles.divider} />
        <SettingRow label={t('settings.notifications')} value={t('common.on')} />
      </Card>

      <Text style={styles.version}>CaStar v1.0.0</Text>
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
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
  },
  settingValue: {
    ...typography.body,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  version: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
