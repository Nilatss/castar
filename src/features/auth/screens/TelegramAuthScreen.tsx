/**
 * Castar — Telegram Auth Screen
 *
 * Waiting screen shown while the user authenticates via Telegram in the browser.
 *
 * Flow:
 *   1. Screen mounts → opens Worker /auth/telegram in EXTERNAL browser
 *   2. Browser shows Telegram Login Widget → user taps → Telegram OAuth
 *   3. User confirms → Telegram redirects to Worker callback with auth params
 *   4. Worker validates HMAC, creates JWT, redirects to castar://auth/callback?...
 *   5. OS catches castar:// deep link → opens app
 *   6. Linking event fires → we parse token + user → loginWithTelegram() → SetName
 *
 * No WebView needed — the entire OAuth flow happens in the external browser.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  AppState,
  Animated,
} from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors, fontFamily } from '../../../shared/constants';
import type { AuthStackParamList } from '../../../shared/types';
import { useAuthStore } from '../store/authStore';
import type { TelegramUser } from '../services/telegramAuth';
import {
  getTelegramAuthUrl,
  isAuthCallback,
  parseAuthCallback,
} from '../services/telegramAuth';

// Back arrow icon
const backArrowSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Telegram icon
const telegramIconSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z" fill="#2AABEE"/>
<path d="M10.862 23.69L34.192 14.476C35.266 14.086 36.208 14.762 35.87 16.384L35.872 16.382L31.632 36.134C31.316 37.478 30.516 37.808 29.402 37.178L23.402 32.748L20.502 35.548C20.178 35.872 19.906 36.144 19.276 36.144L19.736 30.044L30.836 20.044C31.324 19.614 30.726 19.372 30.076 19.802L16.436 28.474L10.508 26.62C9.196 26.21 9.174 25.31 10.862 23.69Z" fill="white"/>
</svg>`;

export const TelegramAuthScreen = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const loginWithTelegram = useAuthStore((s) => s.loginWithTelegram);

  const [error, setError] = useState<string | null>(null);
  const [browserOpened, setBrowserOpened] = useState(false);
  const handledCallback = useRef(false);
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [contentOpacity]),
  );

  /**
   * Handle a successful auth callback — parse data and navigate.
   */
  const handleAuthResult = useCallback(
    (token: string, user: TelegramUser) => {
      if (handledCallback.current) return;
      handledCallback.current = true;

      loginWithTelegram(token, user).then(() => {
        // If loginWithTelegram detected a returning user, isOnboarded is already true
        // and RootNavigator will automatically switch to Main.
        // For new users, isOnboarded is still false → navigate to SetName.
        const { isOnboarded } = useAuthStore.getState();
        if (!isOnboarded) {
          navigation.replace('SetName', { from: 'telegram' });
        }
        // else: RootNavigator will handle the switch to Main
      });
    },
    [loginWithTelegram, navigation],
  );

  /**
   * Open the Telegram auth page in the external browser.
   */
  const openBrowserAuth = useCallback(() => {
    setError(null);
    handledCallback.current = false;

    const url = getTelegramAuthUrl(i18n.language);
    Linking.openURL(url)
      .then(() => {
        setBrowserOpened(true);
      })
      .catch(() => {
        setError(
          t('auth.telegramAuthError') ||
            'Failed to open browser. Please try again.',
        );
      });
  }, [t, i18n.language]);

  /**
   * Open browser on mount.
   */
  useEffect(() => {
    openBrowserAuth();
  }, []);

  /**
   * Listen for deep links — this fires when the OS opens the app
   * via castar://auth/callback from the external browser.
   */
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (isAuthCallback(url)) {
        const result = parseAuthCallback(url);
        if (result) {
          handleAuthResult(result.token, result.user);
        } else {
          setError(
            t('auth.telegramAuthError') || 'Authentication failed. Please try again.',
          );
        }
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Also check if the app was opened with a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url && isAuthCallback(url)) {
        const result = parseAuthCallback(url);
        if (result) {
          handleAuthResult(result.token, result.user);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleAuthResult, t]);

  /**
   * When user comes back to the app from browser without completing auth,
   * show them instructions.
   */
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      // User came back to app from browser
      if (nextState === 'active' && browserOpened && !handledCallback.current) {
        // They came back but auth didn't complete — that's fine,
        // they can tap "Open again" or go back
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [browserOpened]);

  const handleGoBack = useCallback(() => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  }, [navigation, contentOpacity]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SvgXml xml={backArrowSvg} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.loginWithTelegram')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity }]}>
        {/* Main content */}
        <View style={styles.centerContent}>
          {error ? (
            /* Error state */
            <>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openBrowserAuth}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>
                  {t('common.retry') || 'Try Again'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Waiting state */
            <>
              <SvgXml xml={telegramIconSvg} width={64} height={64} />
              <ActivityIndicator
                size="small"
                color={colors.white[50]}
                style={styles.spinner}
              />
              <Text style={styles.waitingTitle}>
                {t('auth.waitingForTelegram') || 'Waiting for Telegram...'}
              </Text>
              <Text style={styles.waitingSubtitle}>
                {t('auth.completeTelegramAuth') ||
                  'Complete authentication in the browser and you will be redirected back to the app.'}
              </Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={openBrowserAuth}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>
                  {t('auth.openAgain') || 'Open Browser Again'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    flex: 1,
  },

  // === Header ===
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white[100],
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // === Center Content ===
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },

  // === Waiting state ===
  spinner: {
    marginTop: 8,
  },
  waitingTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.white[100],
    textAlign: 'center',
    marginTop: 8,
  },
  waitingSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[40],
    textAlign: 'center',
  },

  // === Action button ===
  actionButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 43,
  },
  actionButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.white[100],
  },

  // === Error ===
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[50],
    textAlign: 'center',
  },
});
