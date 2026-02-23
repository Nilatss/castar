/**
 * Castar — Set Name Screen
 *
 * Shown after Telegram auth. User enters their display name
 * before being taken to the main app.
 *
 * Figma: node 10:513 (393x852)
 * Shares glow + logo with OnboardingScreen.
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../../shared/types';

import { colors, fontFamily, grid } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { LogoIcon, GlowCircle1, GlowCircle2 } from '../../../shared/components/svg/AuthSvgs';
import { useAuthStore } from '../store/authStore';

// ============================
// Local JSX SVG Icons (unique to this screen)
// ============================

// User icon — 24x24 (circle + M20 17.5 path — different from shared UserIcon)
const StepUserIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <SvgCircle cx={12} cy={6} r={4} fill="white" />
    <Path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" fill="white" />
  </Svg>
));
StepUserIcon.displayName = 'StepUserIcon';

// Back arrow icon — 28x28 horizontal arrow (different from shared ArrowLeftIcon chevron)
const BackArrowIcon = React.memo(() => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));
BackArrowIcon.displayName = 'BackArrowIcon';

export const SetNameScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'SetName'>>();
  const telegramUser = useAuthStore((s) => s.telegramUser);
  const setDisplayNameAndContinue = useAuthStore((s) => s.setDisplayNameAndContinue);

  // Determine which auth screen to go back to
  const from = route.params?.from;
  const backScreen = from === 'phone' ? 'PhoneAuth' : from === 'telegram' ? 'Onboarding' : 'EmailAuth';

  // Pre-fill with Telegram first_name if available
  const [name, setName] = useState(telegramUser?.first_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Min 3 characters to show continue button
  const isValid = name.trim().length >= 3;

  // Reset isSaving when screen regains focus (e.g. coming back from SetPin)
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
  const buttonOpacity = useRef(new Animated.Value(isValid ? 1 : 0)).current;
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

  // Animate button appearance
  useEffect(() => {
    Animated.timing(buttonOpacity, {
      toValue: isValid ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isValid, buttonOpacity]);

  const handleContinue = useCallback(async () => {
    if (!isValid || isSaving) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await setDisplayNameAndContinue(name.trim());
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate('SetPin');
      });
    } catch {
      setIsSaving(false);
    }
  }, [isValid, isSaving, name, setDisplayNameAndContinue, navigation, contentOpacity]);

  // Handle Android back button — fade out then go back to auth screen
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
          routes: [{ name: backScreen }],
        });
      });
      return true;
    });
    return () => sub.remove();
  }, [navigation, backScreen, contentOpacity]);

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
          <GlowCircle1 id="g1" />
        </View>

        {/* Background glow 2 */}
        <View style={styles.glow2Container} pointerEvents="none">
          <GlowCircle2 id="g2" />
        </View>

        {/* Logo — same position as OnboardingScreen */}
        <View style={styles.logoContainer}>
          <LogoIcon />
        </View>

        {/* Back button — same Y as language button (Figma y:76) */}
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
                routes: [{ name: backScreen }],
              });
            });
          }}
          activeOpacity={0.7}
        >
          <BackArrowIcon />
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
              {/* Header block: icon on top, texts below — Figma: x:24 y:173 */}
              <View style={styles.headerBlock}>
                <StepUserIcon />
                <View style={styles.headerTexts}>
                  <Text style={styles.title}>{t('auth.whatsYourName')}</Text>
                  <Text style={styles.subtitle}>{t('auth.nameSubtitle')}</Text>
                </View>
              </View>

              {/* Input — no border by default, white 20% border on focus */}
              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.namePlaceholder')}
                  placeholderTextColor={colors.white[30]}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  selectionColor={colors.white[50]}
                />
              </View>

              {/* Spacer */}
              <View style={styles.spacer} />

              {/* Continue button — appears when >= 3 chars, adaptive width, padding 24 lr */}
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

  // === Logo — Figma: x:171.22 y:78 ===
  logoContainer: {
    position: 'absolute',
    left: scale(171.22),
    top: scale(78),
    zIndex: 10,
  },

  // === Back button — 48x48, white 10%, borderRadius 12, same Y as lang button ===
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

  // === Header block: icon on top, texts below — Figma: x:24 y:173 ===
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

  // === Spacer ===
  spacer: {
    flex: 1,
  },

  // === Continue Button — adaptive width, h:51, aligned right ===
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
