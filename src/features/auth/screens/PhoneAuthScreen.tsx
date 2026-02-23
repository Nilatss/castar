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
import Svg, { Path, Circle as SvgCircle, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../shared/types';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { sendPhoneVerificationCode } from '../services/phoneAuth';
import {
  GlowCircle1,
  GlowCircle2,
  LogoIcon,
  PhoneIcon,
  ArrowDownIcon,
  CloseCircleIcon,
  CheckCircleIcon,
} from '../../../shared/components/svg/AuthSvgs';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ============================
// Local JSX SVG Icons (unique to this screen)
// ============================

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

// Flag icon — 24x24 (flag on pole, for country code picker header)
const FlagPoleIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip0_18_2257)">
      <Path d="M8 2C8.55228 2 9 2.44772 9 3V4H20C20.3466 4 20.6684 4.17979 20.8506 4.47461C21.0327 4.76939 21.0495 5.13735 20.8945 5.44727L19.1182 9L20.8945 12.5527C21.0495 12.8626 21.0327 13.2306 20.8506 13.5254C20.6684 13.8202 20.3466 14 20 14H9V21C9 21.5523 8.55228 22 8 22C7.44772 22 7 21.5523 7 21V3C7 2.44772 7.44772 2 8 2Z" fill="white" />
    </G>
    <Defs>
      <ClipPath id="clip0_18_2257">
        <Rect width={24} height={24} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
));
FlagPoleIcon.displayName = 'FlagPoleIcon';

// Chevron down icon — 16x16 (small, for country code button)
const ChevronDownSmallIcon = React.memo(() => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M12 6L8 10L4 6" stroke="white" strokeOpacity={0.4} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));
ChevronDownSmallIcon.displayName = 'ChevronDownSmallIcon';

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
                <PhoneIcon />
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
                  <View style={{ opacity: 0.3 }}><StepUserIcon /></View>
                  <Text style={styles.stepText}>{t('auth.stepName')}</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={{ opacity: 0.3 }}><StepPinIcon /></View>
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
                    <ArrowDownIcon />
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
                  <FlagPoleIcon />
                  <Text style={styles.modalTitle}>{t('auth.selectCountry')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={closeCountryCodePicker}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseCircleIcon />
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
                          <CheckCircleIcon />
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
