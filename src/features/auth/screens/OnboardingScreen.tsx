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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, grid } from '../../../shared/constants';
import type { AuthStackParamList } from '../../../shared/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Figma frame = 393px, scale factor for current device
const FIGMA_WIDTH = 393;
const scale = (v: number) => (v / FIGMA_WIDTH) * SCREEN_WIDTH;

// ============================
// SVG Icons
// ============================

const logoSvg = `<svg width="49" height="46" viewBox="0 0 49 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.98343 12.3283C9.38617 7.58872 17.3686 8.05095 23.4014 11.1007L26.0342 12.5929L23.0137 12.9122C17.9759 13.7619 12.904 16.6709 9.34573 20.4992C7.73404 22.2779 6.427 24.318 5.7637 26.5929C3.91853 32.235 6.23411 39.3068 11.711 42.4367C11.9636 42.5582 12.215 42.6705 12.4737 42.7736C12.7146 42.869 12.9604 42.956 13.209 43.0343V43.0792C12.953 43.0077 12.6994 42.9276 12.4492 42.84C12.185 42.7467 11.9254 42.6464 11.6651 42.5363C6.63598 40.019 3.29201 34.1617 3.75101 28.2579C2.85842 27.3331 2.06319 26.2967 1.42093 25.1554C-0.0703107 22.6104 -0.591641 19.1283 0.858429 16.2677C1.6097 14.7162 2.72509 13.4227 3.98343 12.3283ZM19.8086 11.6564C14.8857 9.95133 9.03349 10.1057 5.03421 13.5636C3.88096 14.5325 2.89663 15.6528 2.24417 16.9493C1.01094 19.2996 1.10202 22.1936 2.24026 24.7423C2.65692 25.6991 3.19715 26.6165 3.83304 27.463C3.89172 27.0328 3.97033 26.6028 4.07132 26.1749C4.63209 23.5131 6.03578 21.0835 7.82327 19.1154C11.1341 15.6147 15.1903 12.9953 19.8086 11.6564Z" fill="white"/>
<path d="M15.3069 21.3875C14.8183 26.4871 16.26 32.1312 18.9642 36.6004C20.2524 38.6682 21.879 40.5149 23.9232 41.7762C28.8235 45.0399 36.2344 44.5748 40.6058 40.0613C40.7923 39.8405 40.9701 39.6156 41.139 39.3846C41.7102 38.5996 42.1929 37.7341 42.4671 36.7996H42.4691C42.201 37.7366 41.7404 38.6138 41.1976 39.4266C41.0372 39.6655 40.8687 39.8995 40.6917 40.1307C37.0274 44.3594 30.526 46.1244 24.9944 44.1512C23.8696 44.7876 22.659 45.2991 21.3851 45.6297C18.5348 46.4303 15.0116 45.9797 12.679 43.7898C11.4276 42.6628 10.5076 41.2695 9.80499 39.7977C6.68362 33.3116 9.15251 25.6928 13.6526 20.5584L15.7835 18.3514L15.3069 21.3875ZM13.2562 24.2186C10.3536 28.5938 9.01148 34.3172 11.2757 39.1111C11.8883 40.4532 12.6812 41.6805 13.721 42.6463C15.629 44.4858 18.4405 45.1847 21.1995 44.7312C22.2397 44.5716 23.2745 44.2765 24.263 43.867C23.8591 43.6955 23.4604 43.5047 23.0706 43.2908C20.6151 42.0257 18.6354 39.9791 17.2142 37.6922C14.7704 33.5765 13.3442 29.0021 13.2562 24.2186Z" fill="white"/>
<path d="M45.0168 33.7147C39.6141 38.4543 31.6317 37.992 25.5989 34.9423L22.9661 33.4501L25.9866 33.1307C31.0244 32.281 36.0962 29.3721 39.6545 25.5438C41.2663 23.7651 42.5732 21.7249 43.2366 19.4501C45.0817 13.8079 42.7662 6.73613 37.2893 3.60632C37.0367 3.48482 36.7852 3.37252 36.5266 3.26941C36.2859 3.17403 36.0405 3.08694 35.7922 3.00867V2.96375C36.0479 3.03517 36.3011 3.11553 36.551 3.203C36.8153 3.29623 37.0748 3.39659 37.3352 3.50671C42.3644 6.02393 45.7083 11.8813 45.2493 17.785C46.1419 18.7099 46.9371 19.7463 47.5793 20.8876C49.0706 23.4326 49.5919 26.9147 48.1418 29.7753C47.3905 31.3268 46.2752 32.6203 45.0168 33.7147ZM29.1926 34.3866C34.1154 36.0915 39.9669 35.9371 43.9661 32.4794C45.1193 31.5105 46.1036 30.3902 46.7561 29.0936C47.9894 26.7434 47.8983 23.8494 46.76 21.3007C46.3433 20.3438 45.8031 19.4265 45.1672 18.58C45.1085 19.0102 45.0299 19.4402 44.929 19.868C44.3682 22.5299 42.9645 24.9594 41.177 26.9276C37.8662 30.4281 33.8107 33.0477 29.1926 34.3866Z" fill="white"/>
<path d="M27.4159 0.369598C30.2663 -0.43102 33.7894 0.0194238 36.122 2.20944C37.3734 3.33655 38.2934 4.72975 38.996 6.20163C42.1172 12.6877 39.6484 20.3066 35.1483 25.4409L33.0175 27.6479L33.494 24.6118C33.9827 19.5123 32.5409 13.8681 29.8368 9.3989C28.5485 7.331 26.922 5.48442 24.8778 4.22311C19.9775 0.959157 12.5666 1.42437 8.19521 5.93796C8.00866 6.15875 7.83088 6.38368 7.662 6.61472C7.07998 7.4146 6.58849 8.29751 6.31728 9.25241C6.58293 8.29549 7.05041 7.40073 7.60341 6.57272C7.76374 6.33381 7.93227 6.09982 8.10927 5.86862C11.7737 1.63979 18.2748 -0.125343 23.8065 1.84811C24.9314 1.21162 26.1419 0.700218 27.4159 0.369598ZM35.08 3.353C33.172 1.51334 30.3606 0.814541 27.6015 1.26804C26.5611 1.42768 25.5265 1.72271 24.538 2.13229C24.942 2.3038 25.3405 2.49451 25.7304 2.70847C28.1859 3.97362 30.1656 6.02014 31.5868 8.3071C34.0305 12.4228 35.4568 16.9972 35.5448 21.7807C38.4474 17.4055 39.7894 11.682 37.5253 6.88815C36.9126 5.546 36.1198 4.31887 35.08 3.353Z" fill="white"/>
</svg>`;

// Glow 1: Figma ellipse 350x350, white #FFF, 70% opacity, blur 600
// Blur 600 on a 350px circle means the visible glow extends ~3x the radius.
// We render a much larger SVG (1050x1050) with a very soft radial gradient
// so the falloff looks like a real gaussian blur. The center maps to the
// original 350x350 area, and opacity peaks at 0.14 (70% * spread factor).
const GLOW_RENDER_SIZE = 1050; // 350 * 3 to account for blur spread
const glowSvg = `<svg width="${GLOW_RENDER_SIZE}" height="${GLOW_RENDER_SIZE}" viewBox="0 0 ${GLOW_RENDER_SIZE} ${GLOW_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="0.5" cy="0.5" r="0.5">
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
  <ellipse cx="${GLOW_RENDER_SIZE / 2}" cy="${GLOW_RENDER_SIZE / 2}" rx="${GLOW_RENDER_SIZE / 2}" ry="${GLOW_RENDER_SIZE / 2}" fill="url(#g1)"/>
</svg>`;

// Glow 2: Figma ellipse 159x159, white #FFF, 70% opacity, blur 250
// Rendered at 3x size (477) to simulate blur spread
const GLOW2_RENDER_SIZE = 477; // 159 * 3 to account for blur spread
const glow2Svg = `<svg width="${GLOW2_RENDER_SIZE}" height="${GLOW2_RENDER_SIZE}" viewBox="0 0 ${GLOW2_RENDER_SIZE} ${GLOW2_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g2" cx="0.5" cy="0.5" r="0.5">
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
  <ellipse cx="${GLOW2_RENDER_SIZE / 2}" cy="${GLOW2_RENDER_SIZE / 2}" rx="${GLOW2_RENDER_SIZE / 2}" ry="${GLOW2_RENDER_SIZE / 2}" fill="url(#g2)"/>
</svg>`;

// Arrow down icon from Figma — 20x20, white 40% opacity
const arrowDownSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.8333 7.5L9.99999 12.5L4.16666 7.5" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Language icon from Figma (languages.svg) — 24x24
const languageIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 8L11 14M4 14L10 8L12 5M2 5H14M7 2H8M22 22L17 12L12 22M14 18H20" stroke="#F6F6F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Close circle icon — 40x40, circle bg with X
const closeCircleSvg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="20" cy="20" r="16.6667" fill="white" fill-opacity="0.2"/>
<path d="M24.1666 15.8333L15.8333 24.1666M15.8333 15.8333L24.1666 24.1666" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

// Check circle icon — 24x24, selected language indicator
const checkCircleSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" fill="white"/>
<path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

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
];

// Get flag emoji for the selected country (shown in top bar button)
const getFlagEmoji = (country: string): string => {
  const found = COUNTRIES.find((c) => c.country === country);
  return FLAG_EMOJIS[found?.flagKey ?? 'ru'];
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const OnboardingScreen = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [showLangPicker, setShowLangPicker] = useState(false);
  // Derive initial selectedCountry from current i18n language so the flag matches
  const currentLangCountry = COUNTRIES.find((c) => c.code === i18n.language);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    currentLangCountry?.country ?? 'Русский',
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
    setShowLangPicker(true);
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
    i18n.changeLanguage(country.code);
    setSelectedCountry(country.country);
    // Small delay so user sees the check animate before sheet closes
    setTimeout(() => closePicker(), 200);
  }, [i18n, closePicker]);

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
        <SvgXml xml={glowSvg} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
      </View>

      {/* Background glow 2 — Figma: x:188 y:-144, 159×159, blur 250, #FFF 70% */}
      {/* Rendered at 3x size (477) to simulate blur spread, centered on original position */}
      <View style={styles.glow2Container} pointerEvents="none">
        <SvgXml xml={glow2Svg} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
      </View>

      {/* Logo — Figma: x:171.22 y:78 (from top of frame, includes status bar) */}
      <View style={styles.logoContainer}>
        <SvgXml xml={logoSvg} width={49} height={46} />
      </View>

      {/* Language button — Figma: x:299 y:76, w:70, h:48, borderRadius:12 */}
      <TouchableOpacity
        style={styles.langButton}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <View style={styles.langButtonInner}>
          <Text style={styles.flagEmoji}>{getFlagEmoji(selectedCountry)}</Text>
          <SvgXml xml={arrowDownSvg} width={20} height={20} />
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
                <SvgXml xml={languageIconSvg} width={24} height={24} />
                <Text style={styles.modalTitle}>{t('auth.selectLanguage')}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closePicker}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SvgXml xml={closeCircleSvg} width={40} height={40} />
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
                        <SvgXml xml={checkCircleSvg} width={24} height={24} />
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
