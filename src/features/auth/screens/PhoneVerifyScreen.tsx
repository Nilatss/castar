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
  StatusBar,
  Animated,
  Pressable,
  BackHandler,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../../shared/types';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { GlowCircle1, GlowCircle2, LogoIcon, PhoneIcon } from '../../../shared/components/svg/AuthSvgs';
import { verifyPhoneCode } from '../services/phoneAuth';
import { useAuthStore } from '../store/authStore';

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
// Local unique SVG Icons (JSX, not XML strings)
// ============================

// Back arrow icon — 28x28, horizontal arrow (unique to verify screens)
const ArrowLeftHorizontalIcon = React.memo(() => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));
ArrowLeftHorizontalIcon.displayName = 'ArrowLeftHorizontalIcon';

// Delete/backspace icon for keypad — 32x32 circular back arrow (unique to verify screens)
const DeleteCircleIcon = React.memo(() => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M16.0001 29.3334C8.63628 29.3334 2.66675 23.3639 2.66675 16.0001C2.66675 8.63628 8.63628 2.66675 16.0001 2.66675C23.3639 2.66675 29.3334 8.63628 29.3334 16.0001C29.3334 23.3639 23.3639 29.3334 16.0001 29.3334ZM15.3739 11.293C14.9833 10.9024 14.3502 10.9024 13.9596 11.293L9.95964 15.293C9.56912 15.6835 9.56912 16.3167 9.95964 16.7072L13.9596 20.7072C14.3502 21.0977 14.9833 21.0977 15.3739 20.7072C15.7644 20.3167 15.7644 19.6835 15.3739 19.293L13.081 17.0001H21.3334C21.8857 17.0001 22.3334 16.5524 22.3334 16.0001C22.3334 15.4478 21.8857 15.0001 21.3334 15.0001H13.081L15.3739 12.7072C15.7644 12.3167 15.7644 11.6835 15.3739 11.293Z" fill="white" />
  </Svg>
));
DeleteCircleIcon.displayName = 'DeleteCircleIcon';

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
                    <DeleteCircleIcon />
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
        <GlowCircle1 id="pv1" />
      </View>

      {/* Background glow 2 */}
      <View style={styles.glow2Container} pointerEvents="none">
        <GlowCircle2 id="pv2" />
      </View>

      {/* Green success glows */}
      <Animated.View style={[styles.glowContainer, { opacity: successOpacity }]} pointerEvents="none">
        <GlowCircle1 color={SUCCESS_GREEN} vivid id="pvg1g" />
      </Animated.View>
      <Animated.View style={[styles.glow2Container, { opacity: successOpacity }]} pointerEvents="none">
        <GlowCircle2 color={SUCCESS_GREEN} vivid id="pvg2g" />
      </Animated.View>

      {/* Red error glows */}
      <Animated.View style={[styles.glowContainer, { opacity: errorOpacity }]} pointerEvents="none">
        <GlowCircle1 color={ERROR_RED} vivid id="pvg1r" />
      </Animated.View>
      <Animated.View style={[styles.glow2Container, { opacity: errorOpacity }]} pointerEvents="none">
        <GlowCircle2 color={ERROR_RED} vivid id="pvg2r" />
      </Animated.View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <LogoIcon />
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <ArrowLeftHorizontalIcon />
      </TouchableOpacity>

      {/* Main content */}
      <Animated.View style={[styles.screenContent, { opacity: screenContentOpacity }]}>
        {/* Upper section (header + PIN cells) */}
        <View style={styles.inner}>
          {/* Header block: icon + title + subtitle with phone highlighted */}
          <Animated.View style={[styles.headerBlock, { opacity: textOpacity }]}>
            <PhoneIcon />
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
