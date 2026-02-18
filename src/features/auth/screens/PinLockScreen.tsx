/**
 * Castar -- Pin Lock Screen
 *
 * Shown on app launch when user has a saved PIN.
 * Single phase: enter 4-digit PIN to unlock.
 * On correct PIN -> verifyPin sets isPinVerified=true -> RootNavigator switches to Main.
 * On wrong PIN -> shake + red glow + vibration + error text -> auto-reset.
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
  BackHandler,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { useAuthStore } from '../store/authStore';
import {
  getLockoutUntil,
  getFailedAttempts,
  persistFailedAttempts,
  persistLockoutUntil,
  clearLockoutData,
  getPersistedPin,
} from '../services/telegramAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FIGMA_WIDTH = 393;
const scale = (v: number) => (v / FIGMA_WIDTH) * SCREEN_WIDTH;

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ============================
// SVG Icons
// ============================

const logoSvg = `<svg width="49" height="46" viewBox="0 0 49 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.98343 12.3283C9.38617 7.58872 17.3686 8.05095 23.4014 11.1007L26.0342 12.5929L23.0137 12.9122C17.9759 13.7619 12.904 16.6709 9.34573 20.4992C7.73404 22.2779 6.427 24.318 5.7637 26.5929C3.91853 32.235 6.23411 39.3068 11.711 42.4367C11.9636 42.5582 12.215 42.6705 12.4737 42.7736C12.7146 42.869 12.9604 42.956 13.209 43.0343V43.0792C12.953 43.0077 12.6994 42.9276 12.4492 42.84C12.185 42.7467 11.9254 42.6464 11.6651 42.5363C6.63598 40.019 3.29201 34.1617 3.75101 28.2579C2.85842 27.3331 2.06319 26.2967 1.42093 25.1554C-0.0703107 22.6104 -0.591641 19.1283 0.858429 16.2677C1.6097 14.7162 2.72509 13.4227 3.98343 12.3283ZM19.8086 11.6564C14.8857 9.95133 9.03349 10.1057 5.03421 13.5636C3.88096 14.5325 2.89663 15.6528 2.24417 16.9493C1.01094 19.2996 1.10202 22.1936 2.24026 24.7423C2.65692 25.6991 3.19715 26.6165 3.83304 27.463C3.89172 27.0328 3.97033 26.6028 4.07132 26.1749C4.63209 23.5131 6.03578 21.0835 7.82327 19.1154C11.1341 15.6147 15.1903 12.9953 19.8086 11.6564Z" fill="white"/>
<path d="M15.3069 21.3875C14.8183 26.4871 16.26 32.1312 18.9642 36.6004C20.2524 38.6682 21.879 40.5149 23.9232 41.7762C28.8235 45.0399 36.2344 44.5748 40.6058 40.0613C40.7923 39.8405 40.9701 39.6156 41.139 39.3846C41.7102 38.5996 42.1929 37.7341 42.4671 36.7996H42.4691C42.201 37.7366 41.7404 38.6138 41.1976 39.4266C41.0372 39.6655 40.8687 39.8995 40.6917 40.1307C37.0274 44.3594 30.526 46.1244 24.9944 44.1512C23.8696 44.7876 22.659 45.2991 21.3851 45.6297C18.5348 46.4303 15.0116 45.9797 12.679 43.7898C11.4276 42.6628 10.5076 41.2695 9.80499 39.7977C6.68362 33.3116 9.15251 25.6928 13.6526 20.5584L15.7835 18.3514L15.3069 21.3875ZM13.2562 24.2186C10.3536 28.5938 9.01148 34.3172 11.2757 39.1111C11.8883 40.4532 12.6812 41.6805 13.721 42.6463C15.629 44.4858 18.4405 45.1847 21.1995 44.7312C22.2397 44.5716 23.2745 44.2765 24.263 43.867C23.8591 43.6955 23.4604 43.5047 23.0706 43.2908C20.6151 42.0257 18.6354 39.9791 17.2142 37.6922C14.7704 33.5765 13.3442 29.0021 13.2562 24.2186Z" fill="white"/>
<path d="M45.0168 33.7147C39.6141 38.4543 31.6317 37.992 25.5989 34.9423L22.9661 33.4501L25.9866 33.1307C31.0244 32.281 36.0962 29.3721 39.6545 25.5438C41.2663 23.7651 42.5732 21.7249 43.2366 19.4501C45.0817 13.8079 42.7662 6.73613 37.2893 3.60632C37.0367 3.48482 36.7852 3.37252 36.5266 3.26941C36.2859 3.17403 36.0405 3.08694 35.7922 3.00867V2.96375C36.0479 3.03517 36.3011 3.11553 36.551 3.203C36.8153 3.29623 37.0748 3.39659 37.3352 3.50671C42.3644 6.02393 45.7083 11.8813 45.2493 17.785C46.1419 18.7099 46.9371 19.7463 47.5793 20.8876C49.0706 23.4326 49.5919 26.9147 48.1418 29.7753C47.3905 31.3268 46.2752 32.6203 45.0168 33.7147ZM29.1926 34.3866C34.1154 36.0915 39.9669 35.9371 43.9661 32.4794C45.1193 31.5105 46.1036 30.3902 46.7561 29.0936C47.9894 26.7434 47.8983 23.8494 46.76 21.3007C46.3433 20.3438 45.8031 19.4265 45.1672 18.58C45.1085 19.0102 45.0299 19.4402 44.929 19.868C44.3682 22.5299 42.9645 24.9594 41.177 26.9276C37.8662 30.4281 33.8107 33.0477 29.1926 34.3866Z" fill="white"/>
<path d="M27.4159 0.369598C30.2663 -0.43102 33.7894 0.0194238 36.122 2.20944C37.3734 3.33655 38.2934 4.72975 38.996 6.20163C42.1172 12.6877 39.6484 20.3066 35.1483 25.4409L33.0175 27.6479L33.494 24.6118C33.9827 19.5123 32.5409 13.8681 29.8368 9.3989C28.5485 7.331 26.922 5.48442 24.8778 4.22311C19.9775 0.959157 12.5666 1.42437 8.19521 5.93796C8.00866 6.15875 7.83088 6.38368 7.662 6.61472C7.07998 7.4146 6.58849 8.29751 6.31728 9.25241C6.58293 8.29549 7.05041 7.40073 7.60341 6.57272C7.76374 6.33381 7.93227 6.09982 8.10927 5.86862C11.7737 1.63979 18.2748 -0.125343 23.8065 1.84811C24.9314 1.21162 26.1419 0.700218 27.4159 0.369598ZM35.08 3.353C33.172 1.51334 30.3606 0.814541 27.6015 1.26804C26.5611 1.42768 25.5265 1.72271 24.538 2.13229C24.942 2.3038 25.3405 2.49451 25.7304 2.70847C28.1859 3.97362 30.1656 6.02014 31.5868 8.3071C34.0305 12.4228 35.4568 16.9972 35.5448 21.7807C38.4474 17.4055 39.7894 11.682 37.5253 6.88815C36.9126 5.546 36.1198 4.31887 35.08 3.353Z" fill="white"/>
</svg>`;

// Password Minimalistic icon -- 24x24 (rounded rect with 3 dots)
const pinIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M3.17157 5.17157C2 6.34315 2 8.22876 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.6569 4 17.7712 4 14 4H10C6.22876 4 4.34315 4 3.17157 5.17157ZM8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" fill="white"/>
</svg>`;

// Success color
const SUCCESS_GREEN = '#11DA65';
// Error color
const ERROR_RED = '#FF2626';

// Delete/backspace icon for keypad -- 32x32 round arrow left
const deleteIconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M16.0001 29.3334C8.63628 29.3334 2.66675 23.3639 2.66675 16.0001C2.66675 8.63628 8.63628 2.66675 16.0001 2.66675C23.3639 2.66675 29.3334 8.63628 29.3334 16.0001C29.3334 23.3639 23.3639 29.3334 16.0001 29.3334ZM15.3739 11.293C14.9833 10.9024 14.3502 10.9024 13.9596 11.293L9.95964 15.293C9.56912 15.6835 9.56912 16.3167 9.95964 16.7072L13.9596 20.7072C14.3502 21.0977 14.9833 21.0977 15.3739 20.7072C15.7644 20.3167 15.7644 19.6835 15.3739 19.293L13.081 17.0001H21.3334C21.8857 17.0001 22.3334 16.5524 22.3334 16.0001C22.3334 15.4478 21.8857 15.0001 21.3334 15.0001H13.081L15.3739 12.7072C15.7644 12.3167 15.7644 11.6835 15.3739 11.293Z" fill="white"/>
</svg>`;

// Glow helpers -- pre-built SVG strings (cached outside component to avoid re-creation)
const GLOW_RENDER_SIZE = 1050;
const GLOW2_RENDER_SIZE = 477;

const buildGlowSvg = (size: number, id: string, color: string) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${color}" stop-opacity="0.16"/><stop offset="0.05" stop-color="${color}" stop-opacity="0.15"/><stop offset="0.12" stop-color="${color}" stop-opacity="0.13"/><stop offset="0.20" stop-color="${color}" stop-opacity="0.11"/><stop offset="0.30" stop-color="${color}" stop-opacity="0.08"/><stop offset="0.42" stop-color="${color}" stop-opacity="0.055"/><stop offset="0.55" stop-color="${color}" stop-opacity="0.03"/><stop offset="0.70" stop-color="${color}" stop-opacity="0.015"/><stop offset="0.85" stop-color="${color}" stop-opacity="0.005"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${size / 2}" cy="${size / 2}" rx="${size / 2}" ry="${size / 2}" fill="url(#${id})"/></svg>`;

// Colored glows need higher opacity to appear vivid (matching Figma design)
const buildVividGlowSvg = (size: number, id: string, color: string) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${color}" stop-opacity="0.45"/><stop offset="0.05" stop-color="${color}" stop-opacity="0.40"/><stop offset="0.12" stop-color="${color}" stop-opacity="0.33"/><stop offset="0.20" stop-color="${color}" stop-opacity="0.26"/><stop offset="0.30" stop-color="${color}" stop-opacity="0.19"/><stop offset="0.42" stop-color="${color}" stop-opacity="0.12"/><stop offset="0.55" stop-color="${color}" stop-opacity="0.07"/><stop offset="0.70" stop-color="${color}" stop-opacity="0.03"/><stop offset="0.85" stop-color="${color}" stop-opacity="0.01"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${size / 2}" cy="${size / 2}" rx="${size / 2}" ry="${size / 2}" fill="url(#${id})"/></svg>`;

// Pre-cached SVG strings -- created once at module load, never re-generated
// Use unique gradient IDs to avoid conflict with SetPinScreen
const GLOW1_WHITE = buildGlowSvg(GLOW_RENDER_SIZE, 'pl1w', '#FFFFFF');
const GLOW1_GREEN = buildVividGlowSvg(GLOW_RENDER_SIZE, 'pl1g', SUCCESS_GREEN);
const GLOW1_RED = buildVividGlowSvg(GLOW_RENDER_SIZE, 'pl1r', ERROR_RED);
const GLOW2_WHITE = buildGlowSvg(GLOW2_RENDER_SIZE, 'pl2w', '#FFFFFF');
const GLOW2_GREEN = buildVividGlowSvg(GLOW2_RENDER_SIZE, 'pl2g', SUCCESS_GREEN);
const GLOW2_RED = buildVividGlowSvg(GLOW2_RENDER_SIZE, 'pl2r', ERROR_RED);

// Keypad cell dimensions from Figma
const KEYPAD_CELL_WIDTH = scale(115.33);
const KEYPAD_CELL_HEIGHT = 102;

// PIN cell dimensions from Figma
const PIN_CELL_WIDTH = 42;
const PIN_CELL_HEIGHT = 51;

// ============================
// Memoized Keypad -- never re-renders unless handlers change (they don't thanks to refs)
// ============================
const Keypad = React.memo(({
  onDigit,
  onDelete,
  deleteOpacity,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  deleteOpacity: Animated.Value;
}) => {
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
                <TouchableOpacity
                  key={colIndex}
                  style={styles.keypadCell}
                  onPress={onDelete}
                  activeOpacity={0.6}
                >
                  <Animated.View style={{ opacity: deleteOpacity }}>
                    <SvgXml xml={deleteIconSvg} width={32} height={32} />
                  </Animated.View>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={colIndex}
                style={styles.keypadCell}
                onPress={() => onDigit(key)}
                activeOpacity={0.6}
              >
                <Text style={styles.keypadDigit}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
});

export const PinLockScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const verifyPin = useAuthStore((s) => s.verifyPin);

  // PIN state
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Lockout state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0); // ms remaining
  const failedAttemptsRef = useRef(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Glow mount flags -- avoid rendering heavy SVGs until needed
  const [successGlowMounted, setSuccessGlowMounted] = useState(false);
  const [errorGlowMounted, setErrorGlowMounted] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const screenContentOpacity = useRef(new Animated.Value(0)).current;

  // Delete button opacity -- disabled (0.3) when no digits entered
  const deleteOpacity = useRef(new Animated.Value(0.3)).current;

  // Per-cell dot animations (scale + opacity for smooth fill)
  const dotAnims = useRef(
    Array.from({ length: PIN_LENGTH }, () => new Animated.Value(0)),
  ).current;

  // Per-cell active border opacity (managed via Animated, no re-renders)
  // First cell starts active (border visible)
  const borderAnims = useRef(
    Array.from({ length: PIN_LENGTH }, (_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;

  // Compute lockout timer digits for PIN cells: [M, M, S, S]
  const lockoutDigits = useMemo(() => {
    const totalSeconds = Math.max(0, Math.ceil(lockoutRemaining / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return [mm[0], mm[1], ss[0], ss[1]];
  }, [lockoutRemaining]);

  // Start lockout countdown timer
  const startLockoutTimer = useCallback((lockoutUntil: number) => {
    // Clear any existing timer
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);

    const updateRemaining = () => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        // Lockout expired
        if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
        lockoutTimerRef.current = null;
        setIsLockedOut(false);
        setLockoutRemaining(0);
        failedAttemptsRef.current = 0;
        clearLockoutData();
      } else {
        setLockoutRemaining(remaining);
      }
    };

    setIsLockedOut(true);
    updateRemaining();
    lockoutTimerRef.current = setInterval(updateRemaining, 1000);
  }, []);

  // Check lockout + load failed attempts on mount
  useEffect(() => {
    (async () => {
      const [lockoutUntil, attempts] = await Promise.all([
        getLockoutUntil(),
        getFailedAttempts(),
      ]);
      failedAttemptsRef.current = attempts;

      if (lockoutUntil > Date.now()) {
        startLockoutTimer(lockoutUntil);
      } else if (lockoutUntil > 0) {
        // Lockout was set but has expired -- clear it
        failedAttemptsRef.current = 0;
        clearLockoutData();
      }
    })();

    // Cleanup timer on unmount
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [startLockoutTimer]);

  // Fade in content on mount
  useEffect(() => {
    Animated.timing(screenContentOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [screenContentOpacity]);

  // Lightweight dot animations -- timing on native thread, no spring overhead
  const showDot = useCallback((index: number) => {
    // Move active border: hide current, show next
    if (index > 0) borderAnims[index - 1].setValue(0);
    borderAnims[index].setValue(0);
    // If next cell exists, make it active
    if (index + 1 < PIN_LENGTH) {
      borderAnims[index + 1].setValue(1);
    }
    // Enable delete button on first digit
    if (index === 0) deleteOpacity.setValue(1);
    // Animate dot in
    dotAnims[index].setValue(0);
    Animated.timing(dotAnims[index], {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [dotAnims, borderAnims, deleteOpacity]);

  const hideDot = useCallback((index: number) => {
    // Move active border back to this cell
    if (index + 1 < PIN_LENGTH) borderAnims[index + 1].setValue(0);
    borderAnims[index].setValue(1);
    // Disable delete button when removing last digit
    if (index === 0) deleteOpacity.setValue(0.3);
    // Animate dot out
    Animated.timing(dotAnims[index], {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [dotAnims, borderAnims, deleteOpacity]);

  // Reset all dot + border animations (e.g. error reset)
  const resetDotAnims = useCallback(() => {
    dotAnims.forEach((a) => a.setValue(0));
    borderAnims.forEach((a, i) => a.setValue(i === 0 ? 1 : 0));
    deleteOpacity.setValue(0.3);
  }, [dotAnims, borderAnims, deleteOpacity]);

  // Show success state: green cells + glow, then call onDone
  const showSuccessState = useCallback((onDone: () => void) => {
    setSuccess(true);
    setSuccessGlowMounted(true);
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        onDone();
      }, 600);
    });
  }, [successOpacity]);

  // Handle PIN completion -- verify against stored PIN
  const handlePinComplete = useCallback(async (enteredPin: string) => {
    setIsVerifying(true);

    // Check PIN manually first (don't call verifyPin yet -- it sets isPinVerified
    // which unmounts this screen before the success animation can play)
    const savedPin = await getPersistedPin();
    const isCorrect = savedPin != null && enteredPin === savedPin;

    if (isCorrect) {
      // Correct PIN -- clear lockout data, show success glow, THEN verify
      failedAttemptsRef.current = 0;
      clearLockoutData();
      setErrorGlowMounted(false);
      showSuccessState(() => {
        // Now trigger the state change that unmounts this screen
        verifyPin(enteredPin);
      });
    } else {
      // Wrong PIN -- increment attempts
      failedAttemptsRef.current += 1;
      const attempts = failedAttemptsRef.current;
      persistFailedAttempts(attempts);

      setIsVerifying(false);
      setError(true);
      setSuccessGlowMounted(false);
      Vibration.vibrate(100);

      // Check if lockout should be triggered
      if (attempts >= MAX_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        persistLockoutUntil(lockoutUntil);
        // Show error animation first, then switch to lockout UI
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(() => {
            Animated.timing(errorOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }).start(() => {
              setErrorGlowMounted(false);
              setPin('');
              setError(false);
              resetDotAnims();
              // Activate lockout timer
              startLockoutTimer(lockoutUntil);
            });
          }, 800);
        });
      } else {
        // Fade in red glow
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(() => {
            // Fade out red glow + cells + text together
            Animated.timing(errorOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }).start(() => {
              setErrorGlowMounted(false);
              setPin('');
              setError(false);
              resetDotAnims();
            });
          }, 800);
        });
      }
    }
  }, [verifyPin, shakeAnim, errorOpacity, showSuccessState, resetDotAnims, startLockoutTimer]);

  // Refs for stable callbacks (avoid re-creating callbacks on state changes)
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const errorRef = useRef(error);
  errorRef.current = error;
  const isVerifyingRef = useRef(isVerifying);
  isVerifyingRef.current = isVerifying;
  const isLockedOutRef = useRef(isLockedOut);
  isLockedOutRef.current = isLockedOut;

  const handleDigitPress = useCallback((digit: string) => {
    if (isLockedOutRef.current) return;
    if (isVerifyingRef.current) return;
    if (errorRef.current) {
      setError(false);
      errorOpacity.setValue(0);
      setErrorGlowMounted(false);
      resetDotAnims();
    }
    const prev = pinRef.current;
    const newLen = prev.length + 1;
    if (newLen > PIN_LENGTH) return;
    const next = prev + digit;
    setPin(next);
    showDot(newLen - 1);
    // Pre-mount glows one digit early so SVGs are parsed before animation
    if (newLen === PIN_LENGTH - 1) {
      setSuccessGlowMounted(true);
      setErrorGlowMounted(true);
    }
    // Auto-check on complete
    if (newLen === PIN_LENGTH) {
      setTimeout(() => handlePinComplete(next), 200);
    }
  }, [errorOpacity, handlePinComplete, showDot, resetDotAnims]);

  // Handle delete press
  const handleDelete = useCallback(() => {
    if (isLockedOutRef.current) return;
    if (isVerifyingRef.current) return;
    if (errorRef.current) {
      setError(false);
      errorOpacity.setValue(0);
      setErrorGlowMounted(false);
      resetDotAnims();
    }
    const len = pinRef.current.length;
    if (len > 0) {
      hideDot(len - 1);
      setPin((prev) => prev.slice(0, -1));
    }
  }, [errorOpacity, hideDot, resetDotAnims]);

  // Block Android back button on lock screen
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Don't allow navigating away from lock screen
      return true;
    });
    return () => sub.remove();
  }, []);

  // Pre-build PIN cells once -- all state changes handled by Animated values
  const pinCells = useMemo(() =>
    Array.from({ length: PIN_LENGTH }, (_, i) => (
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
          {/* Dot with scale + opacity animation */}
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
        {/* Error overlay -- always mounted, visibility via opacity */}
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
        {/* Success overlay -- always mounted, visibility via opacity */}
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

      {/* Background glow 1 -- white (base) */}
      <View style={styles.glowContainer}>
        <SvgXml xml={GLOW1_WHITE} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
      </View>
      {/* Background glow 1 -- green (success overlay, mounted only when needed) */}
      {successGlowMounted && (
        <Animated.View style={[styles.glowContainer, { opacity: successOpacity }]}>
          <SvgXml xml={GLOW1_GREEN} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
        </Animated.View>
      )}

      {/* Background glow 2 -- white (base) */}
      <View style={styles.glow2Container}>
        <SvgXml xml={GLOW2_WHITE} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
      </View>
      {/* Background glow 2 -- green (success overlay, mounted only when needed) */}
      {successGlowMounted && (
        <Animated.View style={[styles.glow2Container, { opacity: successOpacity }]}>
          <SvgXml xml={GLOW2_GREEN} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
        </Animated.View>
      )}

      {/* Background glow 1 -- red (error overlay, mounted only when needed) */}
      {errorGlowMounted && (
        <Animated.View style={[styles.glowContainer, { opacity: errorOpacity }]}>
          <SvgXml xml={GLOW1_RED} width={scale(GLOW_RENDER_SIZE)} height={scale(GLOW_RENDER_SIZE)} />
        </Animated.View>
      )}

      {/* Background glow 2 -- red (error overlay, mounted only when needed) */}
      {errorGlowMounted && (
        <Animated.View style={[styles.glow2Container, { opacity: errorOpacity }]}>
          <SvgXml xml={GLOW2_RED} width={scale(GLOW2_RENDER_SIZE)} height={scale(GLOW2_RENDER_SIZE)} />
        </Animated.View>
      )}

      {/* Logo */}
      <View style={styles.logoContainer}>
        <SvgXml xml={logoSvg} width={49} height={46} />
      </View>

      {/* Main content -- fades in on mount */}
      <Animated.View style={[styles.screenContent, { opacity: screenContentOpacity }]}>
        {/* Main content -- upper section (header + PIN) */}
        <View style={styles.inner}>
          {/* Header block: icon + texts */}
          <View style={styles.headerBlock}>
            <SvgXml xml={pinIconSvg} width={24} height={24} />
            <View style={styles.headerTexts}>
              <Text style={styles.title}>
                {isLockedOut ? t('auth.pinLockedTitle') : t('auth.enterPin')}
              </Text>
              <Text style={styles.subtitle}>
                {isLockedOut ? t('auth.pinLockedSubtitle') : t('auth.enterPinSubtitle')}
              </Text>
            </View>
          </View>

          {/* PIN cells / Lockout timer cells */}
          {isLockedOut ? (
            <View style={styles.pinContainer}>
              {lockoutDigits.map((digit, i) => (
                <React.Fragment key={i}>
                  {i === 2 && <Text style={styles.lockoutColon}>:</Text>}
                  <View style={styles.pinCellWrap}>
                    <View style={[styles.pinCell, styles.pinCellLockout]}>
                      <Text style={styles.lockoutDigit}>{digit}</Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          ) : (
            <Animated.View style={[
              styles.pinContainer,
              { transform: [{ translateX: shakeAnim }] },
            ]}>
              {pinCells}
            </Animated.View>
          )}

          {/* Error message -- only shown when NOT locked out */}
          {!isLockedOut && (
            <Animated.View style={styles.errorContainer} pointerEvents="none">
              <Animated.View style={{ opacity: errorOpacity }}>
                <Text style={styles.errorText}>{t('auth.wrongPin')}</Text>
              </Animated.View>
            </Animated.View>
          )}
        </View>

        {/* Keypad -- hidden during lockout */}
        {!isLockedOut && (
          <View style={[styles.keypadFixed, { paddingBottom: insets.bottom + 24 }]}>
            <Keypad onDigit={handleDigitPress} onDelete={handleDelete} deleteOpacity={deleteOpacity} />
          </View>
        )}
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
    color: colors.white[40],
  },

  // === PIN cells ===
  pinContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pinCellWrap: {
    width: PIN_CELL_WIDTH,
    height: PIN_CELL_HEIGHT,
  },
  pinCellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
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

  // === Error text ===
  errorContainer: {
    marginTop: 12,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 18,
    color: ERROR_RED,
  },

  // === Lockout cell ===
  pinCellLockout: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockoutDigit: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white[100],
  },
  lockoutColon: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white[100],
    alignSelf: 'center',
    marginHorizontal: 2,
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
  },
});
