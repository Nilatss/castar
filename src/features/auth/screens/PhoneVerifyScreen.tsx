/**
 * Castar — Phone Verify Screen
 *
 * Shown after PhoneAuth. User enters the 4-digit verification code
 * sent to their phone via SMS, then proceeds to SetName -> SetPin.
 *
 * Layout matches EmailVerifyScreen: custom keypad, PIN-style cells (42x51, dot indicator).
 * No step indicators on this screen.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Pressable,
  BackHandler,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../../shared/types';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { verifyPhoneCode } from '../services/phoneAuth';
import { useAuthStore } from '../store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Figma frame = 393px, scale factor for current device
const FIGMA_WIDTH = 393;
const scale = (v: number) => (v / FIGMA_WIDTH) * SCREEN_WIDTH;
const CODE_LENGTH = 4;

// Success / Error colors (same as SetPinScreen)
const SUCCESS_GREEN = '#11DA65';
const ERROR_RED = '#FF2626';

// PIN cell dimensions (same as SetPinScreen)
const PIN_CELL_WIDTH = 42;
const PIN_CELL_HEIGHT = 51;

// Keypad cell dimensions from Figma (same as SetPinScreen)
const KEYPAD_CELL_WIDTH = scale(115.33);
const KEYPAD_CELL_HEIGHT = 102;

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

// Back arrow icon — 28x28
const arrowLeftSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Delete/backspace icon for keypad — 32x32 round arrow left (same as SetPinScreen)
const deleteIconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M16.0001 29.3334C8.63628 29.3334 2.66675 23.3639 2.66675 16.0001C2.66675 8.63628 8.63628 2.66675 16.0001 2.66675C23.3639 2.66675 29.3334 8.63628 29.3334 16.0001C29.3334 23.3639 23.3639 29.3334 16.0001 29.3334ZM15.3739 11.293C14.9833 10.9024 14.3502 10.9024 13.9596 11.293L9.95964 15.293C9.56912 15.6835 9.56912 16.3167 9.95964 16.7072L13.9596 20.7072C14.3502 21.0977 14.9833 21.0977 15.3739 20.7072C15.7644 20.3167 15.7644 19.6835 15.3739 19.293L13.081 17.0001H21.3334C21.8857 17.0001 22.3334 16.5524 22.3334 16.0001C22.3334 15.4478 21.8857 15.0001 21.3334 15.0001H13.081L15.3739 12.7072C15.7644 12.3167 15.7644 11.6835 15.3739 11.293Z" fill="white"/>
</svg>`;

// Glow 1: 350x350, blur 600, rendered at 3x
const GLOW_RENDER_SIZE = 1050;
const glowSvg = `<svg width="${GLOW_RENDER_SIZE}" height="${GLOW_RENDER_SIZE}" viewBox="0 0 ${GLOW_RENDER_SIZE} ${GLOW_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pv1" cx="0.5" cy="0.5" r="0.5">
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
  <ellipse cx="${GLOW_RENDER_SIZE / 2}" cy="${GLOW_RENDER_SIZE / 2}" rx="${GLOW_RENDER_SIZE / 2}" ry="${GLOW_RENDER_SIZE / 2}" fill="url(#pv1)"/>
</svg>`;

// Glow 2: 159x159, blur 250, rendered at 3x
const GLOW2_RENDER_SIZE = 477;
const glow2Svg = `<svg width="${GLOW2_RENDER_SIZE}" height="${GLOW2_RENDER_SIZE}" viewBox="0 0 ${GLOW2_RENDER_SIZE} ${GLOW2_RENDER_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pv2" cx="0.5" cy="0.5" r="0.5">
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
  <ellipse cx="${GLOW2_RENDER_SIZE / 2}" cy="${GLOW2_RENDER_SIZE / 2}" rx="${GLOW2_RENDER_SIZE / 2}" ry="${GLOW2_RENDER_SIZE / 2}" fill="url(#pv2)"/>
</svg>`;

// Vivid colored glows (same as SetPinScreen)
const buildVividGlowSvg = (size: number, id: string, color: string) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${color}" stop-opacity="0.45"/><stop offset="0.05" stop-color="${color}" stop-opacity="0.40"/><stop offset="0.12" stop-color="${color}" stop-opacity="0.33"/><stop offset="0.20" stop-color="${color}" stop-opacity="0.26"/><stop offset="0.30" stop-color="${color}" stop-opacity="0.19"/><stop offset="0.42" stop-color="${color}" stop-opacity="0.12"/><stop offset="0.55" stop-color="${color}" stop-opacity="0.07"/><stop offset="0.70" stop-color="${color}" stop-opacity="0.03"/><stop offset="0.85" stop-color="${color}" stop-opacity="0.01"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${size / 2}" cy="${size / 2}" rx="${size / 2}" ry="${size / 2}" fill="url(#${id})"/></svg>`;

const GLOW1_GREEN = buildVividGlowSvg(GLOW_RENDER_SIZE, 'pvg1g', SUCCESS_GREEN);
const GLOW1_RED = buildVividGlowSvg(GLOW_RENDER_SIZE, 'pvg1r', ERROR_RED);
const GLOW2_GREEN = buildVividGlowSvg(GLOW2_RENDER_SIZE, 'pvg2g', SUCCESS_GREEN);
const GLOW2_RED = buildVividGlowSvg(GLOW2_RENDER_SIZE, 'pvg2r', ERROR_RED);

// ============================
// Memoized Keypad — same as SetPinScreen
// ============================
const KeypadButton = React.memo(({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [pressAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pressAnim]);

  return (
    <Pressable
      style={styles.keypadCell}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.keypadHighlight,
          { opacity: pressAnim },
        ]}
      />
      <Text style={styles.keypadDigit}>{label}</Text>
    </Pressable>
  );
});

const Keypad = React.memo(({
  onDigit,
  onDelete,
  deleteOpacity,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  deleteOpacity: Animated.Value;
}) => {
  const deletePressAnim = useRef(new Animated.Value(0)).current;

  const handleDeletePressIn = useCallback(() => {
    Animated.timing(deletePressAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [deletePressAnim]);

  const handleDeletePressOut = useCallback(() => {
    Animated.timing(deletePressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [deletePressAnim]);

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['delete', '0', ''],
  ];

  return (
    <View style={styles.keypad}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key, colIndex) => {
            if (key === '') {
              return <View key={colIndex} style={styles.keypadCell} />;
            }
            if (key === 'delete') {
              return (
                <Pressable
                  key={colIndex}
                  style={styles.keypadCell}
                  onPress={onDelete}
                  onPressIn={handleDeletePressIn}
                  onPressOut={handleDeletePressOut}
                >
                  <Animated.View
                    style={[
                      styles.keypadHighlight,
                      { opacity: deletePressAnim },
                    ]}
                  />
                  <Animated.View style={{ opacity: deleteOpacity }}>
                    <SvgXml xml={deleteIconSvg} width={32} height={32} />
                  </Animated.View>
                </Pressable>
              );
            }
            return (
              <KeypadButton
                key={colIndex}
                label={key}
                onPress={() => onDigit(key)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

export const PhoneVerifyScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'PhoneVerify'>>();

  const phone = route.params?.phone ?? '';

  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenContentOpacity = useRef(new Animated.Value(1)).current;

  // Delete button opacity — disabled (0.3) when no digits entered
  const deleteOpacity = useRef(new Animated.Value(0.3)).current;

  // Error/success animated values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  // Per-cell dot animations (scale + opacity for smooth fill)
  const dotAnims = useRef(
    Array.from({ length: CODE_LENGTH }, () => new Animated.Value(0)),
  ).current;

  // Per-cell active border opacity
  const borderAnims = useRef(
    Array.from({ length: CODE_LENGTH }, (_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;

  // Lightweight dot animations
  const showDot = useCallback((index: number) => {
    if (index > 0) borderAnims[index - 1].setValue(0);
    borderAnims[index].setValue(0);
    if (index + 1 < CODE_LENGTH) {
      borderAnims[index + 1].setValue(1);
    }
    if (index === 0) deleteOpacity.setValue(1);
    dotAnims[index].setValue(0);
    Animated.timing(dotAnims[index], {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [dotAnims, borderAnims, deleteOpacity]);

  const hideDot = useCallback((index: number) => {
    if (index + 1 < CODE_LENGTH) borderAnims[index + 1].setValue(0);
    borderAnims[index].setValue(1);
    if (index === 0) deleteOpacity.setValue(0.3);
    Animated.timing(dotAnims[index], {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [dotAnims, borderAnims, deleteOpacity]);

  const resetDotAnims = useCallback(() => {
    dotAnims.forEach((a) => a.setValue(0));
    borderAnims.forEach((a, i) => a.setValue(i === 0 ? 1 : 0));
    deleteOpacity.setValue(0.3);
  }, [dotAnims, borderAnims, deleteOpacity]);

  // Fade in content when screen gains focus (mount + return from SetName)
  useFocusEffect(
    useCallback(() => {
      // Reset state
      setIsSaving(false);
      setError(false);
      setSuccess(false);
      setCode('');
      resetDotAnims();
      successOpacity.setValue(0);
      errorOpacity.setValue(0);
      shakeAnim.setValue(0);

      // Fade in text for phase transition
      Animated.parallel([
        Animated.timing(screenContentOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }, [screenContentOpacity, textOpacity, successOpacity, errorOpacity, shakeAnim, resetDotAnims]),
  );

  // Show success state: green cells + glow, then navigate
  const showSuccessState = useCallback((onDone: () => void) => {
    setSuccess(true);
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setSuccess(false);
          onDone();
        });
      }, 500);
    });
  }, [successOpacity]);

  // Show error state: red cells + glow + shake + vibration, then reset
  const showErrorState = useCallback(() => {
    setError(true);
    Vibration.vibrate(100);
    // Fade in red glow
    Animated.timing(errorOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // Shake
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        // Reset dots BEFORE fading out red overlay — this way the white dots
        // are already hidden under the still-visible red overlay, preventing
        // a 1-frame flash of white dots when errorOpacity reaches 0.
        setCode('');
        resetDotAnims();
        // Fade out red glow then reset
        Animated.timing(errorOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setError(false);
          setIsSaving(false);
        });
      }, 800);
    });
  }, [shakeAnim, errorOpacity, resetDotAnims]);

  // Refs for stable callbacks
  const codeRef = useRef(code);
  codeRef.current = code;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;
  const errorRef = useRef(error);
  errorRef.current = error;

  // Handle code verification against backend
  const handleVerify = useCallback(async (enteredCode: string) => {
    if (isSavingRef.current) return;
    setIsSaving(true);

    try {
      const result = await verifyPhoneCode(phone, enteredCode);

      if (!result.ok) {
        // Wrong code — show error state (red cells, shake, vibration)
        showErrorState();
        return;
      }

      // Show green success animation FIRST, then persist auth.
      const token = result.token;
      showSuccessState(() => {
        Animated.timing(screenContentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(async () => {
          if (token) {
            await useAuthStore.getState().loginWithPhone(token, phone);
          }
          // If loginWithPhone set isOnboarded (returning user), RootNavigator
          // will switch to PinLock automatically. Otherwise navigate to SetName.
          const { isOnboarded } = useAuthStore.getState();
          if (!isOnboarded) {
            navigation.navigate('SetName', { from: 'phone' });
          }
        });
      });
    } catch {
      // Network error — show error state
      showErrorState();
    }
  }, [phone, navigation, screenContentOpacity, showSuccessState, showErrorState]);

  const handleDigitPress = useCallback((digit: string) => {
    if (isSavingRef.current) return;
    // If error is showing, clear it first
    if (errorRef.current) {
      setError(false);
      errorOpacity.setValue(0);
      setCode('');
      resetDotAnims();
      setIsSaving(false);
      // Start fresh with this digit
      const next = digit;
      setCode(next);
      showDot(0);
      return;
    }
    const prev = codeRef.current;
    const newLen = prev.length + 1;
    if (newLen > CODE_LENGTH) return;
    const next = prev + digit;
    setCode(next);
    showDot(newLen - 1);
    // Auto-trigger verification on complete
    if (newLen === CODE_LENGTH) {
      setTimeout(() => handleVerify(next), 300);
    }
  }, [showDot, handleVerify, errorOpacity, resetDotAnims]);

  const handleDelete = useCallback(() => {
    if (isSavingRef.current) return;
    // If error is showing, clear it
    if (errorRef.current) {
      setError(false);
      errorOpacity.setValue(0);
      setCode('');
      setIsSaving(false);
      resetDotAnims();
      return;
    }
    const len = codeRef.current.length;
    if (len > 0) {
      hideDot(len - 1);
      setCode((prev) => prev.slice(0, -1));
    }
  }, [hideDot, errorOpacity, resetDotAnims]);

  // Handle back press
  const handleBack = useCallback(() => {
    Animated.timing(screenContentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      }
    });
  }, [navigation, screenContentOpacity]);

  // Handle Android back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  // Pre-build PIN cells once — all state changes handled by Animated values
  const pinCells = useMemo(() =>
    Array.from({ length: CODE_LENGTH }, (_, i) => (
      <View key={i} style={styles.pinCellWrap}>
        {/* Base cell with animated active border */}
        <Animated.View
          style={[
            styles.pinCell,
            {
              borderColor: borderAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', 'rgba(255,255,255,0.2)'],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pinDot,
              {
                opacity: dotAnims[i],
                transform: [{ scale: dotAnims[i] }],
              },
            ]}
          />
        </Animated.View>
        {/* Error overlay */}
        <Animated.View
          style={[
            styles.pinCell,
            styles.pinCellError,
            styles.pinCellOverlay,
            { opacity: errorOpacity },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.pinDot, styles.pinDotError]} />
        </Animated.View>
        {/* Success overlay */}
        <Animated.View
          style={[
            styles.pinCell,
            styles.pinCellSuccess,
            styles.pinCellOverlay,
            { opacity: successOpacity },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.pinDot, styles.pinDotSuccess]} />
        </Animated.View>
      </View>
    )),
  [dotAnims, borderAnims, errorOpacity, successOpacity]);

  return (
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

      {/* Green success glows */}
      <Animated.View style={[styles.glowContainer, { opacity: successOpacity }]} pointerEvents="none">
        <SvgXml xml={GLOW1_GREEN} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
      </Animated.View>
      <Animated.View style={[styles.glow2Container, { opacity: successOpacity }]} pointerEvents="none">
        <SvgXml xml={GLOW2_GREEN} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
      </Animated.View>

      {/* Red error glows */}
      <Animated.View style={[styles.glowContainer, { opacity: errorOpacity }]} pointerEvents="none">
        <SvgXml xml={GLOW1_RED} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
      </Animated.View>
      <Animated.View style={[styles.glow2Container, { opacity: errorOpacity }]} pointerEvents="none">
        <SvgXml xml={GLOW2_RED} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
      </Animated.View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <SvgXml xml={logoSvg} width={49} height={46} />
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <SvgXml xml={arrowLeftSvg} width={28} height={28} />
      </TouchableOpacity>

      {/* Main content */}
      <Animated.View style={[styles.screenContent, { opacity: screenContentOpacity }]}>
        {/* Upper section (header + PIN cells) */}
        <View style={styles.inner}>
          {/* Header block: icon + title + subtitle with phone highlighted */}
          <Animated.View style={[styles.headerBlock, { opacity: textOpacity }]}>
            <SvgXml xml={phoneIconSvg} width={24} height={24} />
            <View style={styles.headerTexts}>
              <Text style={styles.title}>{t('auth.confirmPhoneTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.confirmPhoneSubtitle')}{'\n'}
                <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>
            </View>
          </Animated.View>

          {/* PIN-style cells with shake animation */}
          <Animated.View
            style={[
              styles.pinContainer,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {pinCells}
          </Animated.View>
        </View>

        {/* Keypad — fixed at bottom */}
        <View style={[styles.keypadFixed, { paddingBottom: insets.bottom + 24 }]}>
          <Keypad onDigit={handleDigitPress} onDelete={handleDelete} deleteOpacity={deleteOpacity} />
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


  screenContent: {
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
    marginBottom: 32,
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
    color: colors.white[20],
  },
  phoneHighlight: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white[100],
  },

  // === PIN-style Cells (matching SetPinScreen) ===
  pinContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pinCellWrap: {
    width: PIN_CELL_WIDTH,
    height: PIN_CELL_HEIGHT,
  },
  pinCell: {
    width: PIN_CELL_WIDTH,
    height: PIN_CELL_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  pinCellError: {
    borderColor: ERROR_RED,
  },
  pinCellSuccess: {
    borderColor: SUCCESS_GREEN,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white[100],
  },
  pinDotError: {
    backgroundColor: ERROR_RED,
  },
  pinDotSuccess: {
    backgroundColor: SUCCESS_GREEN,
  },

  // === Keypad fixed at bottom ===
  keypadFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: grid.margin,
  },
  keypad: {
    gap: 0,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadCell: {
    width: KEYPAD_CELL_WIDTH,
    height: KEYPAD_CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadDigit: {
    fontFamily: fontFamily.regular,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white[100],
    zIndex: 1,
  },
  keypadHighlight: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

});
