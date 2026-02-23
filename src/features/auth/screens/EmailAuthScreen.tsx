/**
 * Castar — Email Auth Screen
 *
 * Shown when user taps "Continue with Email" on Onboarding.
 * User enters their email address, then proceeds to SetName → SetPin.
 *
 * Layout matches SetNameScreen: glows, logo, back button,
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
  StatusBar,
  Animated,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../shared/types';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { sendVerificationCode } from '../services/emailAuth';
import { GlowCircle1, GlowCircle2, LogoIcon } from '../../../shared/components/svg/AuthSvgs';

// ============================
// Local JSX SVG Icons (unique to this screen)
// ============================

// Mailbox icon — 24x24 (actual mailbox with flag, unique to EmailAuthScreen)
const MailboxWithFlagIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M9.5 20V22C9.5 22.4142 9.83579 22.75 10.25 22.75C10.6642 22.75 11 22.4142 11 22V20H9.5Z" fill="white" />
    <Path d="M15 20H13.5V22C13.5 22.4142 13.8358 22.75 14.25 22.75C14.6642 22.75 15 22.4142 15 22V20Z" fill="white" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M17.3846 6.58471L17.6407 6.53344C18.0564 6.45022 18.4863 6.48995 18.8814 6.64813C19.5717 6.92453 20.3266 6.97616 21.0458 6.79618L21.1073 6.7808C21.6309 6.64975 22 6.16299 22 5.60336V3.47284C22 2.73503 21.3358 2.19145 20.6454 2.36421C20.249 2.46342 19.8329 2.43496 19.4523 2.28261L19.3793 2.25335C18.7422 1.99828 18.0491 1.93421 17.3787 2.06841L16.93 2.15824C16.3901 2.26632 16 2.75722 16 3.32846V10.2807C16 10.678 16.31 11 16.6923 11C17.0747 11 17.3846 10.678 17.3846 10.2807V6.58471Z" fill="white" />
    <Path d="M14.5 6V10.2807C14.5 11.4518 15.428 12.5 16.6923 12.5C17.9566 12.5 18.8846 11.4518 18.8846 10.2807V8.22795C19.6455 8.43335 20.4446 8.45735 21.22 8.29496C21.7122 9.13671 22 10.1541 22 11.25V17.4253C22 18.8473 21.0119 20 19.7931 20H12.5V11.25C12.5 9.22014 11.6679 7.27604 10.2826 6H14.5Z" fill="white" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M2 11.25C2 8.35051 4.01472 6 6.5 6C8.98528 6 11 8.35051 11 11.25V20H4.23256C2.99955 20 2 18.8339 2 17.3953V11.25ZM4.25 16C4.25 15.5858 4.58579 15.25 5 15.25H8C8.41421 15.25 8.75 15.5858 8.75 16C8.75 16.4142 8.41421 16.75 8 16.75H5C4.58579 16.75 4.25 16.4142 4.25 16Z" fill="white" />
  </Svg>
));
MailboxWithFlagIcon.displayName = 'MailboxWithFlagIcon';

// User icon — 24x24 (circle + path person, unique variant)
const StepUserIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <SvgCircle cx={12} cy={6} r={4} fill="white" />
    <Path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" fill="white" />
  </Svg>
));
StepUserIcon.displayName = 'StepUserIcon';

// PIN/Password icon — 24x24 (filled rounded rect with 3 dots, unique variant)
const StepPinIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M3.17157 5.17157C2 6.34315 2 8.22876 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.6569 4 17.7712 4 14 4H10C6.22876 4 4.34315 4 3.17157 5.17157ZM8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" fill="white" />
  </Svg>
));
StepPinIcon.displayName = 'StepPinIcon';

// Back arrow icon — 28x28 (horizontal arrow, unique variant)
const ArrowLeftHorizontalIcon = React.memo(() => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));
ArrowLeftHorizontalIcon.displayName = 'ArrowLeftHorizontalIcon';

// Simple email validation
const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export const EmailAuthScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<'validation' | 'api'>('validation');
  const inputRef = useRef<TextInput>(null);
  const errorShownAt = useRef<number>(0);
  const errorDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = isValidEmail(email);
  const hasContent = email.trim().length > 0;

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

  const stepsHeight = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  // Hide error when email becomes valid
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
      // Send verification code to email
      const result = await sendVerificationCode(email.trim());
      if (!result.ok) {
        setIsSaving(false);
        // Show API error (rate limit, Resend failure, etc.)
        triggerError('api');
        return;
      }

      // Proceed to email verification screen
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate('EmailVerify', { email: email.trim() });
      });
    } catch {
      setIsSaving(false);
    }
  }, [isValid, isSaving, hasContent, email, navigation, triggerError, contentOpacity]);

  // Handle Android back button — go to Onboarding
  useEffect(() => {
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
  }, [navigation, contentOpacity]);

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
          <GlowCircle1 />
        </View>

        {/* Background glow 2 */}
        <View style={styles.glow2Container} pointerEvents="none">
          <GlowCircle2 />
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <LogoIcon />
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
          <ArrowLeftHorizontalIcon />
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
                <MailboxWithFlagIcon />
                <View style={styles.headerTexts}>
                  <Text style={styles.title}>{t('auth.emailTitle')}</Text>
                  <Text style={styles.subtitle}>{t('auth.emailSubtitle')}</Text>
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
                  <View style={{ opacity: 0.3 }}><StepUserIcon /></View>
                  <Text style={styles.stepText}>{t('auth.stepName')}</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={{ opacity: 0.3 }}><StepPinIcon /></View>
                  <Text style={styles.stepText}>{t('auth.stepPin')}</Text>
                </View>
              </Animated.View>

              {/* Email input */}
              <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                    showError && styles.inputError,
                  ]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (showError) {
                      dismissError();
                    }
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={colors.white[30]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  maxLength={100}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  onFocus={() => {
                    setIsFocused(true);
                    // Hide error on focus
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
                    // Show error if has content but invalid
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
                {/* Error message */}
                <Animated.Text style={[styles.errorText, { opacity: errorOpacity }]}>
                  {t(errorType === 'api' ? 'auth.emailSendError' : 'auth.emailError')}
                </Animated.Text>
              </Animated.View>

              {/* Spacer */}
              <View style={styles.spacer} />

              {/* Continue button — appears when email is valid */}
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
  input: {
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
  inputFocused: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputError: {
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

});
