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
  StatusBar,
  Animated,
  BackHandler,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { LogoIcon, GlowCircle1, GlowCircle2 } from '../../../shared/components/svg/AuthSvgs';
import { useAuthStore } from '../store/authStore';
import {
  getLockoutUntil,
  getFailedAttempts,
  persistFailedAttempts,
  persistLockoutUntil,
  clearLockoutData,
  getPersistedPin,
} from '../services/telegramAuth';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ============================
// Local JSX SVG Icons (unique to this screen)
// ============================

// Password Minimalistic icon -- 24x24 (rounded rect with 3 dots -- different from shared PinIcon)
const StepPinIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M3.17157 5.17157C2 6.34315 2 8.22876 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.6569 4 17.7712 4 14 4H10C6.22876 4 4.34315 4 3.17157 5.17157ZM8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" fill="white" />
  </Svg>
));
StepPinIcon.displayName = 'StepPinIcon';

// Success color
const SUCCESS_GREEN = '#11DA65';
// Error color
const ERROR_RED = '#FF2626';

// Delete/backspace icon for keypad -- 32x32 round arrow left (different from shared DeleteKeyIcon)
const RoundDeleteIcon = React.memo(() => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M16.0001 29.3334C8.63628 29.3334 2.66675 23.3639 2.66675 16.0001C2.66675 8.63628 8.63628 2.66675 16.0001 2.66675C23.3639 2.66675 29.3334 8.63628 29.3334 16.0001C29.3334 23.3639 23.3639 29.3334 16.0001 29.3334ZM15.3739 11.293C14.9833 10.9024 14.3502 10.9024 13.9596 11.293L9.95964 15.293C9.56912 15.6835 9.56912 16.3167 9.95964 16.7072L13.9596 20.7072C14.3502 21.0977 14.9833 21.0977 15.3739 20.7072C15.7644 20.3167 15.7644 19.6835 15.3739 19.293L13.081 17.0001H21.3334C21.8857 17.0001 22.3334 16.5524 22.3334 16.0001C22.3334 15.4478 21.8857 15.0001 21.3334 15.0001H13.081L15.3739 12.7072C15.7644 12.3167 15.7644 11.6835 15.3739 11.293Z" fill="white" />
  </Svg>
));
RoundDeleteIcon.displayName = 'RoundDeleteIcon';

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
                    <RoundDeleteIcon />
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
        <GlowCircle1 id="pl1w" />
      </View>
      {/* Background glow 1 -- green (success overlay, mounted only when needed) */}
      {successGlowMounted && (
        <Animated.View style={[styles.glowContainer, { opacity: successOpacity }]}>
          <GlowCircle1 color={SUCCESS_GREEN} vivid id="pl1g" />
        </Animated.View>
      )}

      {/* Background glow 2 -- white (base) */}
      <View style={styles.glow2Container}>
        <GlowCircle2 id="pl2w" />
      </View>
      {/* Background glow 2 -- green (success overlay, mounted only when needed) */}
      {successGlowMounted && (
        <Animated.View style={[styles.glow2Container, { opacity: successOpacity }]}>
          <GlowCircle2 color={SUCCESS_GREEN} vivid id="pl2g" />
        </Animated.View>
      )}

      {/* Background glow 1 -- red (error overlay, mounted only when needed) */}
      {errorGlowMounted && (
        <Animated.View style={[styles.glowContainer, { opacity: errorOpacity }]}>
          <GlowCircle1 color={ERROR_RED} vivid id="pl1r" />
        </Animated.View>
      )}

      {/* Background glow 2 -- red (error overlay, mounted only when needed) */}
      {errorGlowMounted && (
        <Animated.View style={[styles.glow2Container, { opacity: errorOpacity }]}>
          <GlowCircle2 color={ERROR_RED} vivid id="pl2r" />
        </Animated.View>
      )}

      {/* Logo */}
      <View style={styles.logoContainer}>
        <LogoIcon />
      </View>

      {/* Main content -- fades in on mount */}
      <Animated.View style={[styles.screenContent, { opacity: screenContentOpacity }]}>
        {/* Main content -- upper section (header + PIN) */}
        <View style={styles.inner}>
          {/* Header block: icon + texts */}
          <View style={styles.headerBlock}>
            <StepPinIcon />
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
