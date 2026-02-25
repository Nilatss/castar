/**
 * Castar — Set PIN Screen
 *
 * Shown after SetName. User creates a 4-digit PIN code.
 * Two phases: (1) Enter PIN, (2) Confirm PIN.
 * Same top layout as SetNameScreen (glow, logo, back, lang).
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { LogoIcon, GlowCircle1, GlowCircle2 } from '../../../shared/components/svg/AuthSvgs';
import { useAuthStore } from '../store/authStore';

const PIN_LENGTH = 4;

// ============================
// Local JSX SVG Icons (unique to this screen)
// ============================

// Password Minimalistic icon — 24x24 (rounded rect with 3 dots — different from shared PinIcon)
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

// Back arrow icon — 28x28 horizontal arrow (different from shared ArrowLeftIcon chevron)
const BackArrowIcon = React.memo(() => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));
BackArrowIcon.displayName = 'BackArrowIcon';

// Delete/backspace icon for keypad — 32x32 round arrow left (different from shared DeleteKeyIcon)
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
// Memoized Keypad — never re-renders unless handlers change (they don't thanks to refs)
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
                    <RoundDeleteIcon />
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

export const SetPinScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const setPinAndContinue = useAuthStore((s) => s.setPinAndContinue);

  // PIN state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phase, setPhase] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenContentOpacity = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  // Delete button opacity — disabled (0.3) when no digits entered
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

  // Fade text in on focus (textOpacity controls create/confirm phase text transition)
  useFocusEffect(
    useCallback(() => {
      Animated.parallel([
        Animated.timing(screenContentOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }, [screenContentOpacity, textOpacity]),
  );

  // Show success state: green cells + glow, then auto-proceed
  const showSuccessState = useCallback((onDone: () => void) => {
    setSuccess(true);
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setSuccess(false);
          onDone();
        });
      }, 600);
    });
  }, [successOpacity]);

  // Lightweight dot animations — timing on native thread, no spring overhead
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

  // Reset all dot + border animations (e.g. phase change, error reset)
  const resetDotAnims = useCallback(() => {
    dotAnims.forEach((a) => a.setValue(0));
    borderAnims.forEach((a, i) => a.setValue(i === 0 ? 1 : 0));
    deleteOpacity.setValue(0.3);
  }, [dotAnims, borderAnims, deleteOpacity]);

  // Handle PIN completion (confirm phase)
  const handlePinComplete = useCallback(async (confirmed: string) => {
    if (confirmed !== pin) {
      // PINs don't match — shake, red glow, and reset
      setError(true);
      Vibration.vibrate(100);
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
          // Reset dots BEFORE fading out red overlay — this way the white dots
          // are already hidden under the still-visible red overlay, preventing
          // a 1-frame flash of white dots when errorOpacity reaches 0.
          setConfirmPin('');
          resetDotAnims();
          // Fade out red glow + cells + text together
          Animated.timing(errorOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            setError(false);
          });
        }, 800);
      });
      return;
    }

    // PINs match — show success glow and save PIN in parallel.
    // Don't rely on animation callbacks (useNativeDriver callbacks can be
    // unreliable on some builds). Instead, use a direct setTimeout for
    // the save/navigate action as a guaranteed path.
    setSuccess(true);
    setIsSaving(true);
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Save PIN and navigate after visual feedback (800ms)
    setTimeout(async () => {
      try {
        await setPinAndContinue(pin);
      } catch (e) {
        // If persist fails, show error and let user retry
        console.error('[SetPin] setPinAndContinue failed:', e);
        setIsSaving(false);
        setSuccess(false);
        successOpacity.setValue(0);
      }
    }, 800);
  }, [pin, shakeAnim, errorOpacity, successOpacity, setPinAndContinue, resetDotAnims]);

  // Handle digit press — uses refs for pin/confirmPin to avoid re-creating callback
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const confirmPinRef = useRef(confirmPin);
  confirmPinRef.current = confirmPin;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const errorRef = useRef(error);
  errorRef.current = error;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;

  const handleDigitPress = useCallback((digit: string) => {
    if (isSavingRef.current) return;
    if (errorRef.current) {
      setError(false);
      errorOpacity.setValue(0);
      resetDotAnims();
    }
    if (phaseRef.current === 'create') {
      const prev = pinRef.current;
      const newLen = prev.length + 1;
      if (newLen > PIN_LENGTH) return;
      const next = prev + digit;
      setPin(next);
      showDot(newLen - 1);
      // Auto-advance to confirm phase with success state
      if (newLen === PIN_LENGTH) {
        setTimeout(() => {
          showSuccessState(() => {
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              setPhase('confirm');
              resetDotAnims();
              Animated.timing(textOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
              }).start();
            });
          });
        }, 200);
      }
    } else {
      const prev = confirmPinRef.current;
      const newLen = prev.length + 1;
      if (newLen > PIN_LENGTH) return;
      const next = prev + digit;
      setConfirmPin(next);
      showDot(newLen - 1);
      // Auto-check on complete
      if (newLen === PIN_LENGTH) {
        setTimeout(() => handlePinComplete(next), 200);
      }
    }
  }, [errorOpacity, textOpacity, showSuccessState, handlePinComplete, showDot, resetDotAnims]);

  // Handle delete press
  const handleDelete = useCallback(() => {
    if (isSavingRef.current) return;
    if (errorRef.current) {
      setError(false);
      errorOpacity.setValue(0);
      resetDotAnims();
    }
    if (phaseRef.current === 'create') {
      const len = pinRef.current.length;
      if (len > 0) {
        hideDot(len - 1);
        setPin((prev) => prev.slice(0, -1));
      }
    } else {
      const len = confirmPinRef.current.length;
      if (len > 0) {
        hideDot(len - 1);
        setConfirmPin((prev) => prev.slice(0, -1));
      }
    }
  }, [errorOpacity, hideDot, resetDotAnims]);

  // Handle back press — go back to create phase or navigate back
  const handleBack = useCallback(() => {
    if (phase === 'confirm') {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setPhase('create');
        setPin('');
        setConfirmPin('');
        setError(false);
        setSuccess(false);
        resetDotAnims();
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    } else {
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
            routes: [{ name: 'SetName' }],
          });
        }
      });
    }
  }, [phase, navigation, textOpacity, screenContentOpacity, resetDotAnims]);

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
        {/* Error overlay — always mounted, visibility via opacity */}
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
        {/* Success overlay — always mounted, visibility via opacity */}
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

      {/* Background glow 1 — white (base) */}
      <View style={styles.glowContainer} pointerEvents="none">
        <GlowCircle1 id="g1w" />
      </View>
      {/* Background glow 1 — green (success overlay) */}
      <Animated.View style={[styles.glowContainer, { opacity: successOpacity }]} pointerEvents="none">
        <GlowCircle1 color={SUCCESS_GREEN} vivid id="g1g" />
      </Animated.View>

      {/* Background glow 2 — white (base) */}
      <View style={styles.glow2Container} pointerEvents="none">
        <GlowCircle2 id="g2w" />
      </View>
      {/* Background glow 2 — green (success overlay) */}
      <Animated.View style={[styles.glow2Container, { opacity: successOpacity }]} pointerEvents="none">
        <GlowCircle2 color={SUCCESS_GREEN} vivid id="g2g" />
      </Animated.View>

      {/* Background glow 1 — red (error overlay) */}
      <Animated.View style={[styles.glowContainer, { opacity: errorOpacity }]} pointerEvents="none">
        <GlowCircle1 color={ERROR_RED} vivid id="g1r" />
      </Animated.View>

      {/* Background glow 2 — red (error overlay) */}
      <Animated.View style={[styles.glow2Container, { opacity: errorOpacity }]} pointerEvents="none">
        <GlowCircle2 color={ERROR_RED} vivid id="g2r" />
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
        <BackArrowIcon />
      </TouchableOpacity>

      {/* Main content */}
      <Animated.View style={[styles.screenContent, { opacity: screenContentOpacity }]}>
        {/* Upper section (header + PIN) */}
        <View style={styles.inner}>
          {/* Header block: icon + texts */}
          <Animated.View style={[styles.headerBlock, { opacity: textOpacity }]}>
            <StepPinIcon />
            <View style={styles.headerTexts}>
              <Text style={styles.title}>
                {phase === 'create' ? t('auth.createPin') : t('auth.confirmPin')}
              </Text>
              <Text style={styles.subtitle}>
                {phase === 'create' ? t('auth.createPinSubtitle') : t('auth.confirmPinSubtitle')}
              </Text>
            </View>
          </Animated.View>

          {/* PIN cells — fully Animated, no re-renders on digit input */}
          <Animated.View style={[
            styles.pinContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}>
            {pinCells}
          </Animated.View>

          {/* Error message — always mounted, absolute so it doesn't shift layout */}
          <Animated.View style={styles.errorContainer} pointerEvents="none">
            <Animated.View style={{ opacity: errorOpacity }}>
              <Text style={styles.errorText}>{t('auth.pinMismatch')}</Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Keypad — fixed at bottom, never shifts */}
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
  pinCellActive: {
    borderColor: 'rgba(255,255,255,0.2)',
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
