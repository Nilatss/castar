/**
 * Castar — Phone Auth Screen
 *
 * Shown when user taps "Continue with Phone" on Onboarding.
 * User enters their phone number, then proceeds to PhoneVerify -> SetName -> SetPin.
 *
 * Layout matches EmailAuthScreen: glows, logo, back button,
 * icon + title + subtitle header, input field, continue button.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Animated,
  Pressable,
  ScrollView,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../shared/types';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { sendPhoneVerificationCode } from '../services/phoneAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

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

// Phone icon — 24x24
const phoneIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.5562 14.4062L15.1007 14.859C15.1007 14.859 14.0181 15.9355 11.0631 12.9972C8.10812 10.059 9.1907 8.98257 9.1907 8.98257L9.47752 8.69738C10.1841 7.99484 10.2507 6.86691 9.63424 6.04348L8.37326 4.35908C7.61028 3.33992 6.13596 3.20529 5.26145 4.07483L3.69185 5.63552C3.25823 6.06668 2.96765 6.62559 3.00289 7.24561C3.09304 8.83182 3.81071 12.2447 7.81536 16.2266C12.0621 20.4492 16.0468 20.617 17.6763 20.4651C18.1917 20.4171 18.6399 20.1546 19.0011 19.7954L20.4217 18.383C21.3806 17.4295 21.1102 15.7949 19.8833 15.128L17.9728 14.0894C17.1672 13.6515 16.1858 13.7801 15.5562 14.4062Z" fill="white"/>
</svg>`;

// User icon — 24x24 (for Name step indicator)
const userIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="6" r="4" fill="white"/>
<path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" fill="white"/>
</svg>`;

// PIN/Password icon — 24x24 (for Pin code step indicator)
const pinIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M3.17157 5.17157C2 6.34315 2 8.22876 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.6569 4 17.7712 4 14 4H10C6.22876 4 4.34315 4 3.17157 5.17157ZM8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" fill="white"/>
</svg>`;

// Back arrow icon — 28x28
const arrowLeftSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Arrow down icon — 20x20, white 40% opacity
const arrowDownSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.8333 7.5L9.99999 12.5L4.16666 7.5" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Close circle icon — 40x40
const closeCircleSvg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="20" cy="20" r="16.6667" fill="white" fill-opacity="0.2"/>
<path d="M24.1666 15.8333L15.8333 24.1666M15.8333 15.8333L24.1666 24.1666" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

// Check circle icon — 24x24
const checkCircleSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" fill="white"/>
<path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Glow 1: 350x350, blur 600, rendered at 3x
const GLOW_RENDER_SIZE = 1050;
const glowSvg = `<svg width="${GLOW_RENDER_SIZE}" height="${GLOW_RENDER_SIZE}" viewBox="0 0 ${GLOW_RENDER_SIZE} ${GLOW_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pa1" cx="0.5" cy="0.5" r="0.5">
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
  <ellipse cx="${GLOW_RENDER_SIZE / 2}" cy="${GLOW_RENDER_SIZE / 2}" rx="${GLOW_RENDER_SIZE / 2}" ry="${GLOW_RENDER_SIZE / 2}" fill="url(#pa1)"/>
</svg>`;

// Glow 2: 159x159, blur 250, rendered at 3x
const GLOW2_RENDER_SIZE = 477;
const glow2Svg = `<svg width="${GLOW2_RENDER_SIZE}" height="${GLOW2_RENDER_SIZE}" viewBox="0 0 ${GLOW2_RENDER_SIZE} ${GLOW2_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pa2" cx="0.5" cy="0.5" r="0.5">
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
  <ellipse cx="${GLOW2_RENDER_SIZE / 2}" cy="${GLOW2_RENDER_SIZE / 2}" rx="${GLOW2_RENDER_SIZE / 2}" ry="${GLOW2_RENDER_SIZE / 2}" fill="url(#pa2)"/>
</svg>`;

// ============================
// Phone country codes
// ============================

type PhoneCountry = {
  flag: string;
  nameKey: string;
  dialCode: string;
  key: string;
  mask: string;        // e.g. '(XX) XXX-XX-XX' — X = digit placeholder
  maxDigits: number;   // number of local digits (without country code)
};

const PHONE_COUNTRIES: PhoneCountry[] = [
  { flag: '\u{1F1FA}\u{1F1FF}', nameKey: 'auth.countryUZ', dialCode: '+998', key: 'uz', mask: '(XX) XXX-XX-XX', maxDigits: 9 },
  { flag: '\u{1F1F7}\u{1F1FA}', nameKey: 'auth.countryRU', dialCode: '+7', key: 'ru', mask: '(XXX) XXX-XX-XX', maxDigits: 10 },
  { flag: '\u{1F1FA}\u{1F1F8}', nameKey: 'auth.countryUS', dialCode: '+1', key: 'us', mask: '(XXX) XXX-XXXX', maxDigits: 10 },
  { flag: '\u{1F1F0}\u{1F1FF}', nameKey: 'auth.countryKZ', dialCode: '+7', key: 'kz', mask: '(XXX) XXX-XX-XX', maxDigits: 10 },
  { flag: '\u{1F1E9}\u{1F1EA}', nameKey: 'auth.countryDE', dialCode: '+49', key: 'de', mask: 'XXX XXXXXXXX', maxDigits: 11 },
  { flag: '\u{1F1E6}\u{1F1FF}', nameKey: 'auth.countryAZ', dialCode: '+994', key: 'az', mask: '(XX) XXX-XX-XX', maxDigits: 9 },
  { flag: '\u{1F1E7}\u{1F1FE}', nameKey: 'auth.countryBY', dialCode: '+375', key: 'by', mask: '(XX) XXX-XX-XX', maxDigits: 9 },
  { flag: '\u{1F1FA}\u{1F1E6}', nameKey: 'auth.countryUA', dialCode: '+380', key: 'ua', mask: '(XX) XXX-XX-XX', maxDigits: 9 },
  { flag: '\u{1F1F9}\u{1F1F7}', nameKey: 'auth.countryTR', dialCode: '+90', key: 'tr', mask: '(XXX) XXX-XX-XX', maxDigits: 10 },
  { flag: '\u{1F1EC}\u{1F1E7}', nameKey: 'auth.countryGB', dialCode: '+44', key: 'gb', mask: 'XXXX XXXXXX', maxDigits: 10 },
];

// Chevron down icon — 16x16 for country code button
const chevronDownSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 6L8 10L4 6" stroke="white" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Flag icon SVG — for country code selector button
const flagIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_18_2257)">
<path d="M8 2C8.55228 2 9 2.44772 9 3V4H20C20.3466 4 20.6684 4.17979 20.8506 4.47461C21.0327 4.76939 21.0495 5.13735 20.8945 5.44727L19.1182 9L20.8945 12.5527C21.0495 12.8626 21.0327 13.2306 20.8506 13.5254C20.6684 13.8202 20.3466 14 20 14H9V21C9 21.5523 8.55228 22 8 22C7.44772 22 7 21.5523 7 21V3C7 2.44772 7.44772 2 8 2Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_18_2257">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>`;

// Apply mask to raw digits: 'X' placeholders get replaced with digits, rest stays
const applyMask = (digits: string, mask: string): string => {
  let result = '';
  let digitIdx = 0;
  for (let i = 0; i < mask.length && digitIdx < digits.length; i++) {
    if (mask[i] === 'X') {
      result += digits[digitIdx++];
    } else {
      result += mask[i];
    }
  }
  return result;
};

// Build placeholder from mask: replace X with 0
const maskToPlaceholder = (mask: string): string => {
  return mask.replace(/X/g, '0');
};

// Validate phone based on country's maxDigits
const isValidPhone = (localNumber: string, maxDigits: number): boolean => {
  const digits = localNumber.replace(/[^0-9]/g, '');
  return digits.length === maxDigits;
};

export const PhoneAuthScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [phone, setPhone] = useState('');
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<PhoneCountry>(PHONE_COUNTRIES[0]);
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<'validation' | 'api'>('validation');
  const inputRef = useRef<TextInput>(null);
  const errorShownAt = useRef<number>(0);
  const errorDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Country code picker animations
  const countryCodeOverlayOpacity = useRef(new Animated.Value(0)).current;
  const countryCodeSheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const countryCodeTopFadeOpacity = useRef(new Animated.Value(0)).current;
  const [countryCodeScrolledDown, setCountryCodeScrolledDown] = useState(false);

  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const fullPhone = selectedPhoneCountry.dialCode + phoneDigits;
  const isValid = isValidPhone(phone, selectedPhoneCountry.maxDigits);
  const hasContent = phoneDigits.length > 0;

  // Reset isSaving when screen regains focus
  useFocusEffect(
    useCallback(() => {
      setIsSaving(false);
    }, []),
  );

  // Track keyboard visibility for bottom padding
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animations
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const stepsOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const stepsHeight = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Fade content in when returning to this screen
  useFocusEffect(
    useCallback(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [contentOpacity]),
  );

  // Animate button appearance
  useEffect(() => {
    Animated.timing(buttonOpacity, {
      toValue: isValid ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isValid, buttonOpacity]);

  const MIN_ERROR_DISPLAY_MS = 3000; // error stays visible for at least 3s

  // Helper: fade out error
  const fadeOutError = useCallback(() => {
    setShowError(false);
    Animated.timing(errorOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [errorOpacity]);

  // Dismiss error respecting minimum display time
  const dismissError = useCallback(() => {
    if (!showError) return;
    if (errorDismissTimer.current) clearTimeout(errorDismissTimer.current);
    const elapsed = Date.now() - errorShownAt.current;
    if (elapsed >= MIN_ERROR_DISPLAY_MS) {
      fadeOutError();
    } else {
      errorDismissTimer.current = setTimeout(fadeOutError, MIN_ERROR_DISPLAY_MS - elapsed);
    }
  }, [showError, fadeOutError]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (errorDismissTimer.current) clearTimeout(errorDismissTimer.current);
    };
  }, []);

  // Hide error when phone becomes valid
  useEffect(() => {
    if (isValid && showError) {
      dismissError();
    }
  }, [isValid, showError, dismissError]);

  // Show error helper
  const triggerError = useCallback((type: 'validation' | 'api' = 'validation') => {
    if (errorDismissTimer.current) clearTimeout(errorDismissTimer.current);
    setErrorType(type);
    setShowError(true);
    errorShownAt.current = Date.now();
    Animated.timing(errorOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    // Shake
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [errorOpacity, shakeAnim]);

  const handleContinue = useCallback(async () => {
    if (isSaving) return;
    if (!isValid) {
      if (hasContent) triggerError();
      return;
    }
    Keyboard.dismiss();
    setIsSaving(true);

    try {
      const res = await sendPhoneVerificationCode(fullPhone);
      if (!res.ok) {
        triggerError('api');
        setIsSaving(false);
        return;
      }
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate('PhoneVerify', { phone: fullPhone });
      });
    } catch {
      triggerError('api');
      setIsSaving(false);
    }
  }, [isValid, isSaving, hasContent, fullPhone, navigation, triggerError, contentOpacity]);

  const handlePhoneChange = useCallback((text: string) => {
    // Extract only digits from input
    const digits = text.replace(/[^0-9]/g, '');
    // Limit to maxDigits for the selected country
    const limited = digits.slice(0, selectedPhoneCountry.maxDigits);
    // Apply the country's mask
    const masked = applyMask(limited, selectedPhoneCountry.mask);
    setPhone(masked);
    if (showError) {
      dismissError();
    }
  }, [showError, dismissError, selectedPhoneCountry]);

  // === Country code picker handlers ===
  const openCountryCodePicker = useCallback(() => {
    Keyboard.dismiss();
    setCountryCodeScrolledDown(false);
    countryCodeTopFadeOpacity.setValue(0);
    setShowCountryCodePicker(true);
    Animated.parallel([
      Animated.timing(countryCodeOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(countryCodeSheetTranslateY, {
        toValue: 0,
        damping: 28,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [countryCodeOverlayOpacity, countryCodeSheetTranslateY, countryCodeTopFadeOpacity]);

  const closeCountryCodePicker = useCallback(() => {
    setShowCountryCodePicker(false);
    Animated.parallel([
      Animated.timing(countryCodeOverlayOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(countryCodeSheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [countryCodeOverlayOpacity, countryCodeSheetTranslateY]);

  const selectPhoneCountry = useCallback((country: PhoneCountry) => {
    setSelectedPhoneCountry(country);
    setPhone(''); // Reset phone when country changes (different mask)
    setTimeout(() => closeCountryCodePicker(), 200);
  }, [closeCountryCodePicker]);

  // === Country code picker scroll handler ===
  const handleCountryCodeScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const isScrolled = y > 4;
    if (isScrolled !== countryCodeScrolledDown) {
      setCountryCodeScrolledDown(isScrolled);
      Animated.timing(countryCodeTopFadeOpacity, {
        toValue: isScrolled ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [countryCodeScrolledDown, countryCodeTopFadeOpacity]);

  // Handle Android back button when country code picker is open
  useEffect(() => {
    if (!showCountryCodePicker) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeCountryCodePicker();
      return true;
    });
    return () => sub.remove();
  }, [showCountryCodePicker, closeCountryCodePicker]);

  // Handle Android back button — go to Onboarding
  useEffect(() => {
    if (showCountryCodePicker) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss();
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      });
      return true;
    });
    return () => sub.remove();
  }, [showCountryCodePicker, navigation, contentOpacity]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Background glow 1 */}
        <View style={styles.glowContainer} pointerEvents="none">
          <SvgXml xml={glowSvg} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
        </View>

        {/* Background glow 2 */}
        <View style={styles.glow2Container} pointerEvents="none">
          <SvgXml xml={glow2Svg} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <SvgXml xml={logoSvg} width={49} height={46} />
        </View>

        {/* Back button — always go to Onboarding */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Keyboard.dismiss();
            Animated.timing(contentOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            });
          }}
          activeOpacity={0.7}
        >
          <SvgXml xml={arrowLeftSvg} width={28} height={28} />
        </TouchableOpacity>

        <Animated.View style={[styles.contentFade, { opacity: contentOpacity }]}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior="padding"
          >
            <View style={[
              styles.inner,
              { paddingBottom: keyboardVisible ? 24 : insets.bottom + 24 },
            ]}>
              {/* Header block: icon + title + subtitle */}
              <View style={styles.headerBlock}>
                <SvgXml xml={phoneIconSvg} width={24} height={24} />
                <View style={styles.headerTexts}>
                  <Text style={styles.title}>{t('auth.phoneTitle')}</Text>
                  <Text style={styles.subtitle}>{t('auth.phoneSubtitle')}</Text>
                </View>
              </View>

              {/* Steps: Name + Pin code — fade out & collapse when input is focused */}
              <Animated.View
                style={[
                  styles.stepsContainer,
                  {
                    opacity: stepsOpacity,
                    maxHeight: stepsHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 64],
                    }),
                    marginBottom: stepsHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 24],
                    }),
                  },
                ]}
              >
                <View style={styles.stepRow}>
                  <SvgXml xml={userIconSvg} width={24} height={24} style={{ opacity: 0.3 }} />
                  <Text style={styles.stepText}>{t('auth.stepName')}</Text>
                </View>
                <View style={styles.stepRow}>
                  <SvgXml xml={pinIconSvg} width={24} height={24} style={{ opacity: 0.3 }} />
                  <Text style={styles.stepText}>{t('auth.stepPin')}</Text>
                </View>
              </Animated.View>

              {/* Phone input row: country code button + input */}
              <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
                <View style={styles.phoneInputRow}>
                  {/* Country code selector */}
                  <TouchableOpacity
                    style={[
                      styles.countryCodeButton,
                      isFocused && styles.countryCodeButtonFocused,
                      showError && styles.countryCodeButtonError,
                    ]}
                    activeOpacity={0.7}
                    onPress={openCountryCodePicker}
                  >
                    <Text style={styles.countryCodeFlag}>{selectedPhoneCountry.flag}</Text>
                    <SvgXml xml={arrowDownSvg} width={20} height={20} />
                  </TouchableOpacity>

                  {/* Phone number input */}
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.phoneInput,
                      isFocused && styles.phoneInputFocused,
                      showError && styles.phoneInputError,
                    ]}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder={maskToPlaceholder(selectedPhoneCountry.mask)}
                    placeholderTextColor={colors.white[30]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="number-pad"
                    textContentType="telephoneNumber"
                    maxLength={selectedPhoneCountry.mask.length}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    onFocus={() => {
                      setIsFocused(true);
                      if (showError) {
                        dismissError();
                      }
                      Animated.parallel([
                        Animated.timing(stepsOpacity, {
                          toValue: 0,
                          duration: 200,
                          useNativeDriver: false,
                        }),
                        Animated.timing(stepsHeight, {
                          toValue: 0,
                          duration: 250,
                          useNativeDriver: false,
                        }),
                      ]).start();
                    }}
                    onBlur={() => {
                      setIsFocused(false);
                      if (hasContent && !isValid) {
                        triggerError();
                      }
                      Animated.parallel([
                        Animated.timing(stepsOpacity, {
                          toValue: 1,
                          duration: 200,
                          useNativeDriver: false,
                        }),
                        Animated.timing(stepsHeight, {
                          toValue: 1,
                          duration: 250,
                          useNativeDriver: false,
                        }),
                      ]).start();
                    }}
                    selectionColor={colors.white[50]}
                  />
                </View>
                {/* Error message */}
                <Animated.Text style={[styles.errorText, { opacity: errorOpacity }]}>
                  {t(errorType === 'api' ? 'auth.phoneSendError' : 'auth.phoneError')}
                </Animated.Text>
              </Animated.View>

              {/* Spacer */}
              <View style={styles.spacer} />

              {/* Continue button — appears when phone is valid */}
              <Animated.View
                style={[styles.continueButtonWrap, { opacity: buttonOpacity }]}
                pointerEvents={isValid ? 'auto' : 'none'}
              >
                <TouchableOpacity
                  style={styles.continueButton}
                  activeOpacity={0.8}
                  onPress={handleContinue}
                  disabled={!isValid}
                >
                  <Text style={styles.continueButtonText}>
                    {t('common.next')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* ===== Country Code Picker Overlay — always mounted, animated only ===== */}
        <View style={styles.overlayRoot} pointerEvents={showCountryCodePicker ? 'auto' : 'none'}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: countryCodeOverlayOpacity }]}>
              <BlurView
                intensity={10}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.overlayTint} />
            </Animated.View>

            <Pressable style={styles.overlayDismiss} onPress={closeCountryCodePicker} />

            <Animated.View
              style={[
                styles.modalSheet,
                { paddingBottom: insets.bottom + 24, transform: [{ translateY: countryCodeSheetTranslateY }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <SvgXml xml={flagIconSvg} width={24} height={24} />
                  <Text style={styles.modalTitle}>{t('auth.selectCountry')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={closeCountryCodePicker}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SvgXml xml={closeCircleSvg} width={40} height={40} />
                </TouchableOpacity>
              </View>

              <View style={styles.countryListWrapper}>
                <ScrollView
                  style={styles.countryList}
                  contentContainerStyle={styles.countryListContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  onScroll={handleCountryCodeScroll}
                  scrollEventThrottle={16}
                >
                  {PHONE_COUNTRIES.map((country) => {
                    const isSelected = country.key === selectedPhoneCountry.key;
                    return (
                      <TouchableOpacity
                        key={country.key}
                        style={styles.countryRow}
                        onPress={() => selectPhoneCountry(country)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.countryFlagWrap}>
                          <Text style={styles.flagEmojiLarge}>{country.flag}</Text>
                        </View>
                        <Text style={styles.countryName}>{t(country.nameKey)}</Text>
                        <Text style={styles.countryCodeDialText}>{country.dialCode}</Text>
                        {isSelected ? (
                          <SvgXml xml={checkCircleSvg} width={24} height={24} />
                        ) : (
                          <View style={styles.radioOuter} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Animated.View style={[styles.scrollFadeTop, { opacity: countryCodeTopFadeOpacity }]} pointerEvents="none">
                  <LinearGradient
                    colors={[colors.neutral[900], 'rgba(26, 26, 26, 0.8)', 'rgba(26, 26, 26, 0)']}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>

                <LinearGradient
                  colors={['rgba(26, 26, 26, 0)', 'rgba(26, 26, 26, 0.8)', colors.neutral[900]]}
                  style={styles.scrollFadeBottom}
                  pointerEvents="none"
                />
              </View>
            </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // === Glow 1 ===
  glowContainer: {
    position: 'absolute',
    left: scale(22 + 175 - GLOW_RENDER_SIZE / 2),
    top: scale(-175 + 175 - GLOW_RENDER_SIZE / 2),
  },

  // === Glow 2 ===
  glow2Container: {
    position: 'absolute',
    left: scale(267.5 - GLOW2_RENDER_SIZE / 2),
    top: scale(-64.5 - GLOW2_RENDER_SIZE / 2),
  },

  // === Logo ===
  logoContainer: {
    position: 'absolute',
    left: scale(171.22),
    top: scale(78),
    zIndex: 10,
  },

  // === Back button ===
  backButton: {
    position: 'absolute',
    left: scale(24),
    top: scale(76),
    zIndex: 10,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentFade: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: grid.margin,
  },

  // === Header block ===
  headerBlock: {
    marginTop: scale(173),
    gap: 12,
    marginBottom: 24,
  },
  headerTexts: {
    gap: 8,
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white[100],
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[40],
  },

  // === Input ===
  inputContainer: {
    width: '100%',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeButton: {
    width: 70,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[900],
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryCodeButtonFocused: {
    borderColor: 'transparent',
  },
  countryCodeButtonError: {
    borderColor: colors.error[700],
  },
  countryCodeFlag: {
    fontSize: 18,
    lineHeight: 22,
  },
  countryCodeText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[100],
  },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: colors.neutral[900],
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  phoneInputFocused: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  phoneInputError: {
    borderColor: colors.error[700],
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.error[500],
    marginTop: 8,
    marginLeft: 4,
  },

  // === Steps (Name + Pin code) ===
  stepsContainer: {
    gap: 16,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[30],
  },

  // === Spacer ===
  spacer: {
    flex: 1,
  },

  // === Continue Button ===
  continueButtonWrap: {
    alignSelf: 'flex-end',
  },
  continueButton: {
    height: 51,
    backgroundColor: colors.white[100],
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.neutral[950],
    textAlign: 'center',
  },

  // === Flag emoji ===
  flagEmojiLarge: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },

  // ============================================================
  // COUNTRY CODE PICKER OVERLAY
  // ============================================================

  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 16, 16, 0.5)',
  },
  overlayDismiss: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.neutral[900],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '75%',
  },
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
  scrollFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1,
  },
  scrollFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[850],
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
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[100],
  },
  countryCodeDialText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[30],
    marginRight: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.white[30],
    margin: 2,
  },
});
