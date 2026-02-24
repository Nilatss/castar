import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Pressable,
  ScrollView,
  Dimensions,
  BackHandler,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '../../profile/store/profileStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import {
  LogoIcon, GlowCircle1, GlowCircle2,
  ArrowDownIcon, LanguageIcon, CloseCircleIcon, CheckCircleIcon,
} from '../../../shared/components/svg/AuthSvgs';
import type { AuthStackParamList } from '../../../shared/types';

// ============================
// Country flag emojis
// ============================

const FLAG_EMOJIS: Record<string, string> = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  us: '🇺🇸',
  kz: '🇰🇿',
  de: '🇩🇪',
  az: '🇦🇿',
  by: '🇧🇾',
  ua: '🇺🇦',
  pl: '🇵🇱',
  ge: '🇬🇪',
  cn: '🇨🇳',
};

// ============================
// Country list
// ============================

type CountryOption = {
  code: string;       // i18n language code
  country: string;    // Display name
  flagKey: string;    // Key in FLAG_SVGS
};

const COUNTRIES: CountryOption[] = [
  { code: 'ru', country: 'Русский', flagKey: 'ru' },
  { code: 'uz', country: 'O\'zbek', flagKey: 'uz' },
  { code: 'en', country: 'English', flagKey: 'us' },
  { code: 'kk', country: 'Қазақша', flagKey: 'kz' },
  { code: 'de', country: 'Deutsch', flagKey: 'de' },
  { code: 'az', country: 'Azərbaycan', flagKey: 'az' },
  { code: 'be', country: 'Беларуская', flagKey: 'by' },
  { code: 'uk', country: 'Українська', flagKey: 'ua' },
  { code: 'pl', country: 'Polski', flagKey: 'pl' },
  { code: 'ka', country: 'ქართული', flagKey: 'ge' },
  { code: 'zh', country: '中文', flagKey: 'cn' },
];

// Get flag emoji for the selected country (shown in top bar button)
const getFlagEmoji = (country: string): string => {
  const found = COUNTRIES.find((c) => c.country === country);
  return FLAG_EMOJIS[found?.flagKey ?? 'us'];
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const OnboardingScreen = () => {
  const { t, i18n } = useTranslation();
  const storeSetLanguage = useProfileStore((s) => s.setLanguage);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [showLangPicker, setShowLangPicker] = useState(false);
  // Derive initial selectedCountry from current i18n language so the flag matches
  const currentLangCountry = COUNTRIES.find((c) => c.code === i18n.language);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    currentLangCountry?.country ?? 'English',
  );
  const [scrolledDown, setScrolledDown] = useState(false);

  // Sync selectedCountry with i18n.language when screen regains focus
  useFocusEffect(
    useCallback(() => {
      const lang = COUNTRIES.find((c) => c.code === i18n.language);
      if (lang) setSelectedCountry(lang.country);
    }, [i18n.language]),
  );

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const topFadeOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // When returning to this screen (e.g. user pressed back), opacity is already 0
  // from the fade-out that happened before navigation. Animate it back to 1.
  // On first mount, opacity starts at 1 — animation is a no-op (correct).
  useFocusEffect(
    useCallback(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [contentOpacity]),
  );

  // Navigate with fade-out
  const navigateWithFade = useCallback((screen: keyof AuthStackParamList) => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(screen as any);
    });
  }, [contentOpacity, navigation]);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const isScrolled = y > 4;
    if (isScrolled !== scrolledDown) {
      setScrolledDown(isScrolled);
      Animated.timing(topFadeOpacity, {
        toValue: isScrolled ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [scrolledDown, topFadeOpacity]);

  const openPicker = useCallback(() => {
    setScrolledDown(false);
    topFadeOpacity.setValue(0);
    sheetTranslateY.setValue(SCREEN_HEIGHT);
    overlayOpacity.setValue(0);
    setShowLangPicker(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 28,
            stiffness: 220,
            mass: 0.9,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }, [overlayOpacity, sheetTranslateY, topFadeOpacity]);

  const closePicker = useCallback(() => {
    setShowLangPicker(false);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, sheetTranslateY]);

  const changeLanguage = useCallback((country: CountryOption) => {
    storeSetLanguage(country.code);
    setSelectedCountry(country.country);
    // Small delay so user sees the check animate before sheet closes
    setTimeout(() => closePicker(), 200);
  }, [storeSetLanguage, closePicker]);

  // Handle Android back button when picker is open
  useEffect(() => {
    if (!showLangPicker) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closePicker();
      return true;
    });
    return () => sub.remove();
  }, [showLangPicker, closePicker]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={showLangPicker ? colors.neutral[900] : 'transparent'}
        translucent
      />

      {/* Background glow 1 — Figma: x:22 y:-175, 350×350, blur 600, #FFF 70% */}
      {/* Rendered at 3x size (1050) to simulate blur spread, centered on original position */}
      <View style={styles.glowContainer} pointerEvents="none">
        <GlowCircle1 />
      </View>

      {/* Background glow 2 — Figma: x:188 y:-144, 159×159, blur 250, #FFF 70% */}
      {/* Rendered at 3x size (477) to simulate blur spread, centered on original position */}
      <View style={styles.glow2Container} pointerEvents="none">
        <GlowCircle2 />
      </View>

      {/* Logo — Figma: x:171.22 y:78 (from top of frame, includes status bar) */}
      <View style={styles.logoContainer}>
        <LogoIcon />
      </View>

      {/* Language button — Figma: x:299 y:76, w:70, h:48, borderRadius:12 */}
      <TouchableOpacity
        style={styles.langButton}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <View style={styles.langButtonInner}>
          <Text style={styles.flagEmoji}>{getFlagEmoji(selectedCountry)}</Text>
          <ArrowDownIcon />
        </View>
      </TouchableOpacity>

      <Animated.View style={[{ flex: 1 }, { opacity: contentOpacity }]}>
        {/* Content — flex layout, pushed to bottom */}
        <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          {/* Title block — fixed width 248 per Figma */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{t('auth.welcome')}</Text>
            <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
          </View>

          {/* Buttons section */}
          <View style={styles.buttonsSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => navigateWithFade('TelegramAuth')}
            >
              <Text style={styles.primaryButtonText}>
                {t('auth.loginWithTelegram')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.secondaryButtonsGroup}>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.7}
                onPress={() => navigateWithFade('PhoneAuth')}
              >
                <Text style={styles.secondaryButtonText}>
                  {t('auth.continueWithPhone')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.7}
                onPress={() => navigateWithFade('EmailAuth')}
              >
                <Text style={styles.secondaryButtonText}>
                  {t('auth.continueWithEmail')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.privacyText}>
            {t('auth.privacyPrefix')}
            <Text style={styles.privacyLink} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('auth.privacyPolicy')}</Text>
            {t('auth.privacyAnd')}
            <Text style={styles.privacyLink} onPress={() => navigation.navigate('TermsOfUse')}>{t('auth.termsConditions')}</Text>
          </Text>
        </View>
      </Animated.View>

      {/* ===== Language Picker Overlay — always mounted, animated only ===== */}
      <View style={styles.overlayRoot} pointerEvents={showLangPicker ? 'auto' : 'none'}>
          {/* Animated blur + tint backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}>
            <BlurView
              intensity={10}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.overlayTint} />
          </Animated.View>

          {/* Tap outside sheet to close */}
          <Pressable
            style={styles.overlayDismiss}
            onPress={closePicker}
          />

          {/* Animated Sheet — slides up from bottom */}
          <Animated.View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + 24, transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            {/* Header: icon + title with close button centered vertically */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LanguageIcon />
                <Text style={styles.modalTitle}>{t('auth.selectLanguage')}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closePicker}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseCircleIcon />
              </TouchableOpacity>
            </View>

            {/* Country list with bottom fade gradient */}
            <View style={styles.countryListWrapper}>
              <ScrollView
                style={styles.countryList}
                contentContainerStyle={styles.countryListContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {COUNTRIES.map((country, index) => {
                  const isSelected = country.country === selectedCountry;
                  return (
                    <TouchableOpacity
                      key={`${country.country}-${index}`}
                      style={styles.countryRow}
                      onPress={() => changeLanguage(country)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.countryFlagWrap}>
                        <Text style={styles.flagEmojiLarge}>{FLAG_EMOJIS[country.flagKey]}</Text>
                      </View>
                      <Text style={styles.countryName}>{country.country}</Text>
                      {isSelected ? (
                        <CheckCircleIcon />
                      ) : (
                        <View style={styles.radioOuter} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Top fade gradient — only visible when scrolled */}
              <Animated.View style={[styles.scrollFadeTop, { opacity: topFadeOpacity }]} pointerEvents="none">
                <LinearGradient
                  colors={[
                    colors.neutral[900],
                    'rgba(26, 26, 26, 0.8)',
                    'rgba(26, 26, 26, 0)',
                  ]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Bottom fade gradient over scroll */}
              <LinearGradient
                colors={[
                  'rgba(26, 26, 26, 0)',
                  'rgba(26, 26, 26, 0.8)',
                  colors.neutral[900],
                ]}
                style={styles.scrollFadeBottom}
                pointerEvents="none"
              />
            </View>
          </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // === Glow — Figma ellipse: x:22 y:-175, 350×350 ===
  // Rendered at 3x (1050×1050). We offset so the center of the 3x circle
  // matches the center of the original 350×350 at (22+175, -175+175) = (197, 0).
  // For 3x: left = centerX - renderSize/2 = 197 - 525 = -328
  //          top  = centerY - renderSize/2 = 0 - 525 = -525
  glowContainer: {
    position: 'absolute',
    left: scale(22 + 175 - GLOW_RENDER_SIZE / 2),
    top: scale(-175 + 175 - GLOW_RENDER_SIZE / 2),
  },

  // === Glow 2 — Figma ellipse: x:188 y:-144, 159×159, blur 250 ===
  // Rendered at 3x (477×477). Center of original = (188+79.5, -144+79.5) = (267.5, -64.5)
  // For 3x: left = centerX - renderSize/2 = 267.5 - 238.5 = 29
  //          top  = centerY - renderSize/2 = -64.5 - 238.5 = -303
  glow2Container: {
    position: 'absolute',
    left: scale(267.5 - GLOW2_RENDER_SIZE / 2),
    top: scale(-64.5 - GLOW2_RENDER_SIZE / 2),
  },

  // === Logo — Figma: x:171.22 y:78 (absolute from screen top) ===
  logoContainer: {
    position: 'absolute',
    left: scale(171.22),
    top: scale(78),
    zIndex: 10,
  },

  // === Language button — Figma: x:299 y:76 (absolute from screen top) ===
  langButton: {
    position: 'absolute',
    left: scale(299),
    top: scale(76),
    zIndex: 10,
  },
  langButtonInner: {
    width: 70,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    gap: 4,
  },

  // === Content ===
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: grid.margin,
  },

  // === Title — fixed width 248 ===
  titleBlock: {
    width: 248,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: 32,
    lineHeight: 40,
    color: colors.white[100],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[40],
    textAlign: 'center',
  },

  // === Buttons ===
  buttonsSection: {
    gap: 16,
  },
  primaryButton: {
    height: 51,
    backgroundColor: colors.white[100],
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.neutral[950],
    textAlign: 'center',
  },

  // === Divider ===
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.white[30],
  },
  dividerText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.white[100],
    textAlign: 'center',
  },

  // === Secondary buttons ===
  secondaryButtonsGroup: {
    gap: 6,
  },
  secondaryButton: {
    height: 51,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white[100],
    textAlign: 'center',
  },

  // === Privacy ===
  privacyText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.white[40],
    textAlign: 'center',
    marginTop: 24,
  },
  privacyLink: {
    color: colors.white[100],
  },

  // ============================================================
  // OVERLAY (inline, no Modal — so BlurView actually works)
  // ============================================================

  // Covers entire screen including status bar
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  // Semi-transparent dark tint on top of blur — #101010 at 50%
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 16, 16, 0.5)',
  },

  // Tap area above the sheet to dismiss
  overlayDismiss: {
    flex: 1,
  },

  // Bottom sheet
  modalSheet: {
    backgroundColor: colors.neutral[900], // #1A1A1A
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '75%',
  },

  // Header container: icon + title left, close button right centered
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    gap: 12,
    flex: 1,
  },
  modalCloseBtn: {
    marginLeft: 12,
  },
  modalTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white[100],
  },

  // === Country list wrapper (for fade gradient) ===
  countryListWrapper: {
    flex: 1,
    minHeight: 200,
  },

  countryList: {
    flex: 1,
  },

  countryListContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Scroll fade gradient at top
  scrollFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1,
  },

  // Scroll fade gradient at bottom
  scrollFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },

  // === Country row ===
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[850], // #1E1E1E
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  countryFlagWrap: {
    width: 24,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[100],
  },

  // === Flag emoji styles ===
  flagEmoji: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
  },
  flagEmojiLarge: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
  },

  // === Unselected radio circle — matches checkCircleSvg (20px circle inside 24px box) ===
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.white[30],
    margin: 2, // center 20px circle in 24px space
  },
});
