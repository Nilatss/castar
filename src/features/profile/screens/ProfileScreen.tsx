/**
 * Castar — Profile Screen
 *
 * Shows user info (avatar, name, username) and a logout button.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors, fontFamily } from '../../../shared/constants';
import { useAuthStore } from '../../auth/store/authStore';

// User avatar placeholder icon
const userAvatarSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="32" cy="32" r="32" fill="rgba(255,255,255,0.1)"/>
<circle cx="32" cy="26" r="10" fill="rgba(255,255,255,0.3)"/>
<path d="M14 52C14 42.059 22.059 34 32 34C41.941 34 50 42.059 50 52" stroke="rgba(255,255,255,0.3)" stroke-width="2" fill="none"/>
</svg>`;

// Chevron right icon
const chevronRightSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 15L12.5 10L7.5 5" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Logout icon
const logoutSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#F55858" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16 17L21 12L16 7" stroke="#F55858" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21 12H9" stroke="#F55858" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const ProfileScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const telegramUser = useAuthStore((s) => s.telegramUser);
  const savedDisplayName = useAuthStore((s) => s.displayName);
  const logout = useAuthStore((s) => s.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Prefer saved display name (from SetName screen), fall back to Telegram name
  const displayName = savedDisplayName
    || (telegramUser
      ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ')
      : t('profile.guest') || 'Guest');

  const username = telegramUser?.username
    ? `@${telegramUser.username}`
    : '';

  const handleLogout = useCallback(() => {
    Alert.alert(
      t('profile.logoutTitle') || 'Log out',
      t('profile.logoutConfirm') || 'Are you sure you want to log out?',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('profile.logout') || 'Log out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  }, [logout, t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      {/* User card */}
      <View style={styles.userCard}>
        {telegramUser?.photo_url ? (
          <View style={styles.avatarContainer}>
            {/* We could use Image here but for simplicity use placeholder */}
            <SvgXml xml={userAvatarSvg} width={64} height={64} />
          </View>
        ) : (
          <SvgXml xml={userAvatarSvg} width={64} height={64} />
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          {username ? (
            <Text style={styles.userUsername} numberOfLines={1}>
              {username}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuItemText}>{t('profile.settings')}</Text>
          <SvgXml xml={chevronRightSvg} width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuItemText}>{t('profile.language')}</Text>
          <SvgXml xml={chevronRightSvg} width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuItemText}>{t('profile.currency')}</Text>
          <SvgXml xml={chevronRightSvg} width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuItemText}>{t('profile.about')}</Text>
          <SvgXml xml={chevronRightSvg} width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#F55858" />
          ) : (
            <SvgXml xml={logoutSvg} width={24} height={24} />
          )}
          <Text style={styles.logoutText}>
            {t('profile.logout') || 'Log out'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // === Header ===
  header: {
    paddingHorizontal: 24,
    height: 56,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white[100],
  },

  // === User Card ===
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.white[100],
  },
  userUsername: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[40],
  },

  // === Menu ===
  menuSection: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: colors.neutral[900],
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  menuItemText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[100],
  },

  // === Logout ===
  logoutSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: 'rgba(245, 88, 88, 0.1)',
    borderRadius: 16,
    gap: 10,
  },
  logoutText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: '#F55858',
  },
});
