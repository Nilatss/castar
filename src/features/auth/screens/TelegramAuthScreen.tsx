/**
 * Castar — Telegram Auth Screen (Figma design)
 *
 * Waiting screen shown while the user authenticates via Telegram in the browser.
 * Uses the same background glow as OnboardingScreen for visual consistency.
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
  Linking,
  AppState,
  Dimensions,
} from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

import { colors, fontFamily, grid } from '../../../shared/constants';
import type { AuthStackParamList } from '../../../shared/types';
import { useAuthStore } from '../store/authStore';
import type { TelegramUser } from '../services/telegramAuth';
import {
  getTelegramAuthUrl,
  isAuthCallback,
  parseAuthCallback,
} from '../services/telegramAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Figma frame = 393px, scale factor for current device
const FIGMA_WIDTH = 393;
const scale = (v: number) => (v / FIGMA_WIDTH) * SCREEN_WIDTH;

// ============================
// SVG Icons (same as OnboardingScreen for consistency)
// ============================

// Castar logo — same as Onboarding
const logoSvg = `<svg width="49" height="46" viewBox="0 0 49 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.98343 12.3283C9.38617 7.58872 17.3686 8.05095 23.4014 11.1007L26.0342 12.5929L23.0137 12.9122C17.9759 13.7619 12.904 16.6709 9.34573 20.4992C7.73404 22.2779 6.427 24.318 5.7637 26.5929C3.91853 32.235 6.23411 39.3068 11.711 42.4367C11.9636 42.5582 12.215 42.6705 12.4737 42.7736C12.7146 42.869 12.9604 42.956 13.209 43.0343V43.0792C12.953 43.0077 12.6994 42.9276 12.4492 42.84C12.185 42.7467 11.9254 42.6464 11.6651 42.5363C6.63598 40.019 3.29201 34.1617 3.75101 28.2579C2.85842 27.3331 2.06319 26.2967 1.42093 25.1554C-0.0703107 22.6104 -0.591641 19.1283 0.858429 16.2677C1.6097 14.7162 2.72509 13.4227 3.98343 12.3283ZM19.8086 11.6564C14.8857 9.95133 9.03349 10.1057 5.03421 13.5636C3.88096 14.5325 2.89663 15.6528 2.24417 16.9493C1.01094 19.2996 1.10202 22.1936 2.24026 24.7423C2.65692 25.6991 3.19715 26.6165 3.83304 27.463C3.89172 27.0328 3.97033 26.6028 4.07132 26.1749C4.63209 23.5131 6.03578 21.0835 7.82327 19.1154C11.1341 15.6147 15.1903 12.9953 19.8086 11.6564Z" fill="white"/>
<path d="M15.3069 21.3875C14.8183 26.4871 16.26 32.1312 18.9642 36.6004C20.2524 38.6682 21.879 40.5149 23.9232 41.7762C28.8235 45.0399 36.2344 44.5748 40.6058 40.0613C40.7923 39.8405 40.9701 39.6156 41.139 39.3846C41.7102 38.5996 42.1929 37.7341 42.4671 36.7996H42.4691C42.201 37.7366 41.7404 38.6138 41.1976 39.4266C41.0372 39.6655 40.8687 39.8995 40.6917 40.1307C37.0274 44.3594 30.526 46.1244 24.9944 44.1512C23.8696 44.7876 22.659 45.2991 21.3851 45.6297C18.5348 46.4303 15.0116 45.9797 12.679 43.7898C11.4276 42.6628 10.5076 41.2695 9.80499 39.7977C6.68362 33.3116 9.15251 25.6928 13.6526 20.5584L15.7835 18.3514L15.3069 21.3875ZM13.2562 24.2186C10.3536 28.5938 9.01148 34.3172 11.2757 39.1111C11.8883 40.4532 12.6812 41.6805 13.721 42.6463C15.629 44.4858 18.4405 45.1847 21.1995 44.7312C22.2397 44.5716 23.2745 44.2765 24.263 43.867C23.8591 43.6955 23.4604 43.5047 23.0706 43.2908C20.6151 42.0257 18.6354 39.9791 17.2142 37.6922C14.7704 33.5765 13.3442 29.0021 13.2562 24.2186Z" fill="white"/>
<path d="M45.0168 33.7147C39.6141 38.4543 31.6317 37.992 25.5989 34.9423L22.9661 33.4501L25.9866 33.1307C31.0244 32.281 36.0962 29.3721 39.6545 25.5438C41.2663 23.7651 42.5732 21.7249 43.2366 19.4501C45.0817 13.8079 42.7662 6.73613 37.2893 3.60632C37.0367 3.48482 36.7852 3.37252 36.5266 3.26941C36.2859 3.17403 36.0405 3.08694 35.7922 3.00867V2.96375C36.0479 3.03517 36.3011 3.11553 36.551 3.203C36.8153 3.29623 37.0748 3.39659 37.3352 3.50671C42.3644 6.02393 45.7083 11.8813 45.2493 17.785C46.1419 18.7099 46.9371 19.7463 47.5793 20.8876C49.0706 23.4326 49.5919 26.9147 48.1418 29.7753C47.3905 31.3268 46.2752 32.6203 45.0168 33.7147ZM29.1926 34.3866C34.1154 36.0915 39.9669 35.9371 43.9661 32.4794C45.1193 31.5105 46.1036 30.3902 46.7561 29.0936C47.9894 26.7434 47.8983 23.8494 46.76 21.3007C46.3433 20.3438 45.8031 19.4265 45.1672 18.58C45.1085 19.0102 45.0299 19.4402 44.929 19.868C44.3682 22.5299 42.9645 24.9594 41.177 26.9276C37.8662 30.4281 33.8107 33.0477 29.1926 34.3866Z" fill="white"/>
<path d="M27.4159 0.369598C30.2663 -0.43102 33.7894 0.0194238 36.122 2.20944C37.3734 3.33655 38.2934 4.72975 38.996 6.20163C42.1172 12.6877 39.6484 20.3066 35.1483 25.4409L33.0175 27.6479L33.494 24.6118C33.9827 19.5123 32.5409 13.8681 29.8368 9.3989C28.5485 7.331 26.922 5.48442 24.8778 4.22311C19.9775 0.959157 12.5666 1.42437 8.19521 5.93796C8.00866 6.15875 7.83088 6.38368 7.662 6.61472C7.07998 7.4146 6.58849 8.29751 6.31728 9.25241C6.58293 8.29549 7.05041 7.40073 7.60341 6.57272C7.76374 6.33381 7.93227 6.09982 8.10927 5.86862C11.7737 1.63979 18.2748 -0.125343 23.8065 1.84811C24.9314 1.21162 26.1419 0.700218 27.4159 0.369598ZM35.08 3.353C33.172 1.51334 30.3606 0.814541 27.6015 1.26804C26.5611 1.42768 25.5265 1.72271 24.538 2.13229C24.942 2.3038 25.3405 2.49451 25.7304 2.70847C28.1859 3.97362 30.1656 6.02014 31.5868 8.3071C34.0305 12.4228 35.4568 16.9972 35.5448 21.7807C38.4474 17.4055 39.7894 11.682 37.5253 6.88815C36.9126 5.546 36.1198 4.31887 35.08 3.353Z" fill="white"/>
</svg>`;

// Glow 1: same as OnboardingScreen — Figma ellipse 350x350, blur 600
const GLOW_RENDER_SIZE = 1050;
const glowSvg = `<svg width="${GLOW_RENDER_SIZE}" height="${GLOW_RENDER_SIZE}" viewBox="0 0 ${GLOW_RENDER_SIZE} ${GLOW_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="tg1" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="0.05" stop-color="#FFFFFF" stop-opacity="0.15"/>
      <stop offset="0.12" stop-color="#FFFFFF" stop-opacity="0.13"/>
      <stop offset="0.20" stop-color="#FFFFFF" stop-opacity="0.11"/>
      <stop offset="0.30" stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="0.42" stop-color="#FFFFFF" stop-opacity="0.055"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.03"/>
      <stop offset="0.70" stop-color="#FFFFFF" stop-opacity="0.015"/>
      <stop offset="0.85" stop-color="#FFFFFF" stop-opacity="0.005"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${GLOW_RENDER_SIZE / 2}" cy="${GLOW_RENDER_SIZE / 2}" rx="${GLOW_RENDER_SIZE / 2}" ry="${GLOW_RENDER_SIZE / 2}" fill="url(#tg1)"/>
</svg>`;

// Glow 2: same as OnboardingScreen — Figma ellipse 159x159, blur 250
const GLOW2_RENDER_SIZE = 477;
const glow2Svg = `<svg width="${GLOW2_RENDER_SIZE}" height="${GLOW2_RENDER_SIZE}" viewBox="0 0 ${GLOW2_RENDER_SIZE} ${GLOW2_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="tg2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="0.05" stop-color="#FFFFFF" stop-opacity="0.15"/>
      <stop offset="0.12" stop-color="#FFFFFF" stop-opacity="0.13"/>
      <stop offset="0.20" stop-color="#FFFFFF" stop-opacity="0.11"/>
      <stop offset="0.30" stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="0.42" stop-color="#FFFFFF" stop-opacity="0.055"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.03"/>
      <stop offset="0.70" stop-color="#FFFFFF" stop-opacity="0.015"/>
      <stop offset="0.85" stop-color="#FFFFFF" stop-opacity="0.005"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${GLOW2_RENDER_SIZE / 2}" cy="${GLOW2_RENDER_SIZE / 2}" rx="${GLOW2_RENDER_SIZE / 2}" ry="${GLOW2_RENDER_SIZE / 2}" fill="url(#tg2)"/>
</svg>`;

// ============================
// Component
// ============================

export const TelegramAuthScreen = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const loginWithTelegram = useAuthStore((s) => s.loginWithTelegram);

  const [error, setError] = useState<string | null>(null);
  const [browserOpened, setBrowserOpened] = useState(false);
  const handledCallback = useRef(false);

  // Pulsing dots animation — opacity oscillates 0.3 → 1 → 0.3
  const dotsOpacity = useSharedValue(0.3);

  useEffect(() => {
    dotsOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
      false,
    );
  }, [dotsOpacity]);

  const dotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
   * they see the "Open Telegram again" button.
   */
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && browserOpened && !handledCallback.current) {
        // No-op: UI already shows "Open Telegram again" button
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [browserOpened]);

  // Navigate back to Onboarding
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Background glow 1 — same position as OnboardingScreen */}
      <View style={styles.glowContainer} pointerEvents="none">
        <SvgXml xml={glowSvg} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
      </View>

      {/* Background glow 2 — same position as OnboardingScreen */}
      <View style={styles.glow2Container} pointerEvents="none">
        <SvgXml xml={glow2Svg} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
      </View>

      {/* Logo — same position as OnboardingScreen */}
      <View style={styles.logoContainer}>
        <SvgXml xml={logoSvg} width={49} height={46} />
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        {error ? (
          /* Error state */
          <Animated.View entering={FadeIn.duration(200)} style={styles.centerBlock}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={openBrowserAuth}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>
                {t('common.retry') || 'Try Again'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Waiting state */
          <View style={styles.centerBlock}>
            {/* Title with animated dots */}
            <View style={styles.titleRow}>
              <Text style={styles.waitingTitle}>
                {t('auth.waitingTelegram') || 'Waiting Telegram'}
              </Text>
              <Animated.Text style={[styles.waitingDots, dotsAnimatedStyle]}>
                ...
              </Animated.Text>
            </View>

            {/* Subtitle */}
            <Text style={styles.waitingSubtitle}>
              {t('auth.telegramBrowserHint') ||
                'Complete authentication in the browser and you will be redirected back to the app.'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom buttons */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
        {/* Open Telegram again — same style as OnboardingScreen secondary button */}
        <TouchableOpacity
          style={styles.openAgainButton}
          onPress={openBrowserAuth}
          activeOpacity={0.7}
        >
          <Text style={styles.openAgainButtonText}>
            {t('auth.openTelegramAgain') || 'Open Telegram again'}
          </Text>
        </TouchableOpacity>

        {/* Cancel text button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        >
          <Text style={styles.cancelButtonText}>
            {t('common.cancel') || 'Cancel'}
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

  // === Glow — same as OnboardingScreen ===
  glowContainer: {
    position: 'absolute',
    left: scale(22 + 175 - GLOW_RENDER_SIZE / 2),
    top: scale(-175 + 175 - GLOW_RENDER_SIZE / 2),
  },
  glow2Container: {
    position: 'absolute',
    left: scale(267.5 - GLOW2_RENDER_SIZE / 2),
    top: scale(-64.5 - GLOW2_RENDER_SIZE / 2),
  },

  // === Logo — same as OnboardingScreen ===
  logoContainer: {
    position: 'absolute',
    left: scale(171.22),
    top: scale(78),
    zIndex: 10,
  },

  // === Center content (vertically centered) ===
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: grid.margin,
  },
  centerBlock: {
    alignItems: 'center',
    width: '100%',
  },

  // === Waiting state ===
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  waitingTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white[100],
    textAlign: 'center',
  },
  waitingDots: {
    fontFamily: fontFamily.medium,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white[100],
  },
  waitingSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[40],
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 280,
  },

  // === Error state ===
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[50],
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 43,
  },
  retryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.white[100],
  },

  // === Bottom section ===
  bottomSection: {
    paddingHorizontal: grid.margin,
    gap: 16,
    alignItems: 'center',
  },

  // "Open Telegram again" — same style as OnboardingScreen secondary button
  openAgainButton: {
    width: '100%',
    height: 51,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openAgainButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white[100],
  },

  // "Cancel" text button
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[40],
  },
});
