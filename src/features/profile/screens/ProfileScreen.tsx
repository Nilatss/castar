import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { Card } from '../../../shared/components';
import { useAuthStore } from '../../auth/store/authStore';
import type { ProfileStackParamList } from '../../../shared/types/navigation';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  label: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.menuItem}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const displayName = useAuthStore((s) => s.displayName);
  const userId = useAuthStore((s) => s.userId);
  const logout = useAuthStore((s) => s.logout);

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName ?? t('profile.guest')}</Text>
        {userId && <Text style={styles.userId}>{userId}</Text>}
      </View>

      {/* Menu */}
      <Card style={styles.menuCard}>
        <MenuItem label={t('profile.settings')} onPress={() => navigation.navigate('Settings')} />
        <View style={styles.divider} />
        <MenuItem label={t('tabs.categories')} onPress={() => navigation.navigate('Categories')} />
      </Card>

      <TouchableOpacity onPress={logout} activeOpacity={0.7} style={styles.logoutButton}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
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
  title: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.heading2,
    color: colors.text,
  },
  name: {
    ...typography.heading4,
    color: colors.text,
  },
  userId: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
  },
  menuArrow: {
    ...typography.heading4,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  logoutButton: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  logoutText: {
    ...typography.bodyMedium,
    color: colors.error[500],
  },
});
