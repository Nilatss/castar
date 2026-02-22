import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Ellipse as SvgEllipse,
  Path,
  Circle as SvgCircle,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, fontFamily, borderRadius } from '../../../shared/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIGMA_WIDTH = 393;
const scale = (v: number) => (v / FIGMA_WIDTH) * SCREEN_WIDTH;

// ═══════════════════════════════════════════════
// Glow config
// ═══════════════════════════════════════════════

const GLOW_RENDER_SIZE = 1050;
const GLOW2_RENDER_SIZE = 477;

const GLOW_STOPS = [
  { offset: '0', opacity: 0.16 },
  { offset: '0.05', opacity: 0.15 },
  { offset: '0.12', opacity: 0.13 },
  { offset: '0.20', opacity: 0.11 },
  { offset: '0.30', opacity: 0.08 },
  { offset: '0.42', opacity: 0.055 },
  { offset: '0.55', opacity: 0.03 },
  { offset: '0.70', opacity: 0.015 },
  { offset: '0.85', opacity: 0.005 },
  { offset: '1', opacity: 0 },
];

// ═══════════════════════════════════════════════
// All SVG components — JSX (no XML string parsing)
// ═══════════════════════════════════════════════

const GlowCircle1 = React.memo(() => (
  <Svg
    width={scale(GLOW_RENDER_SIZE)}
    height={scale(GLOW_RENDER_SIZE)}
    viewBox={`0 0 ${GLOW_RENDER_SIZE} ${GLOW_RENDER_SIZE}`}
  >
    <Defs>
      <RadialGradient id="sg1" cx="0.5" cy="0.5" r="0.5">
        {GLOW_STOPS.map((s) => (
          <Stop key={s.offset} offset={s.offset} stopColor="#FFF" stopOpacity={s.opacity} />
        ))}
      </RadialGradient>
    </Defs>
    <SvgEllipse
      cx={GLOW_RENDER_SIZE / 2}
      cy={GLOW_RENDER_SIZE / 2}
      rx={GLOW_RENDER_SIZE / 2}
      ry={GLOW_RENDER_SIZE / 2}
      fill="url(#sg1)"
    />
  </Svg>
));

const GlowCircle2 = React.memo(() => (
  <Svg
    width={scale(GLOW2_RENDER_SIZE)}
    height={scale(GLOW2_RENDER_SIZE)}
    viewBox={`0 0 ${GLOW2_RENDER_SIZE} ${GLOW2_RENDER_SIZE}`}
  >
    <Defs>
      <RadialGradient id="sg2" cx="0.5" cy="0.5" r="0.5">
        {GLOW_STOPS.map((s) => (
          <Stop key={s.offset} offset={s.offset} stopColor="#FFF" stopOpacity={s.opacity} />
        ))}
      </RadialGradient>
    </Defs>
    <SvgEllipse
      cx={GLOW2_RENDER_SIZE / 2}
      cy={GLOW2_RENDER_SIZE / 2}
      rx={GLOW2_RENDER_SIZE / 2}
      ry={GLOW2_RENDER_SIZE / 2}
      fill="url(#sg2)"
    />
  </Svg>
));

// Back arrow — 28x28, stroke white (same as auth screens)
const BackArrowIcon = React.memo(() => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path
      d="M23.3334 14H4.66675M4.66675 14L11.6667 7M4.66675 14L11.6667 21"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Radio checked — white circle with dark checkmark, 24x24
const RadioCheckedIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <SvgCircle cx={12} cy={12} r={12} fill="white" />
    <Path
      d="M7.5 12L10.5 15L16.5 9"
      stroke="#101010"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Radio unchecked — outline circle, 24x24
const RadioUncheckedIcon = React.memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <SvgCircle cx={12} cy={12} r={11} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
  </Svg>
));

// Shared rounded-rect background path for 36x36 advantage icons
const ICON_BG = 'M0 8C0 3.58172 3.58172 0 8 0H28C32.4183 0 36 3.58172 36 8V28C36 32.4183 32.4183 36 28 36H8C3.58172 36 0 32.4183 0 28V8Z';

// Advantage icon: Categories — checklist
const IconCategories = React.memo(() => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path d={ICON_BG} fill="white" fillOpacity={0.1} />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.8869 10.887C9.6665 12.1074 9.6665 14.0716 9.6665 18C9.6665 21.9283 9.6665 23.8925 10.8869 25.1129C12.1073 26.3333 14.0715 26.3333 17.9998 26.3333C21.9282 26.3333 23.8924 26.3333 25.1128 25.1129C26.3332 23.8925 26.3332 21.9283 26.3332 18C26.3332 14.0716 26.3332 12.1074 25.1128 10.887C23.8924 9.66663 21.9282 9.66663 17.9998 9.66663C14.0715 9.66663 12.1073 9.66663 10.8869 10.887ZM16.7858 14.2643C17.0238 14.0144 17.0142 13.6188 16.7642 13.3807C16.5142 13.1427 16.1186 13.1523 15.8806 13.4023L13.9522 15.427L13.4524 14.9023C13.2144 14.6523 12.8188 14.6427 12.5688 14.8807C12.3188 15.1188 12.3092 15.5144 12.5473 15.7643L13.4996 16.7643C13.6176 16.8882 13.7812 16.9583 13.9522 16.9583C14.1233 16.9583 14.2868 16.8882 14.4048 16.7643L16.7858 14.2643ZM18.8332 14.875C18.488 14.875 18.2082 15.1548 18.2082 15.5C18.2082 15.8451 18.488 16.125 18.8332 16.125H22.9998C23.345 16.125 23.6248 15.8451 23.6248 15.5C23.6248 15.1548 23.345 14.875 22.9998 14.875H18.8332ZM16.7858 20.0977C17.0238 19.8477 17.0142 19.4521 16.7642 19.214C16.5142 18.976 16.1186 18.9856 15.8806 19.2356L13.9522 21.2604L13.4524 20.7356C13.2144 20.4856 12.8188 20.476 12.5688 20.714C12.3188 20.9521 12.3092 21.3477 12.5473 21.5977L13.4996 22.5977C13.6176 22.7215 13.7812 22.7916 13.9522 22.7916C14.1233 22.7916 14.2868 22.7215 14.4048 22.5977L16.7858 20.0977ZM18.8332 20.7083C18.488 20.7083 18.2082 20.9881 18.2082 21.3333C18.2082 21.6785 18.488 21.9583 18.8332 21.9583H22.9998C23.345 21.9583 23.6248 21.6785 23.6248 21.3333C23.6248 20.9881 23.345 20.7083 22.9998 20.7083H18.8332Z"
      fill="white"
    />
  </Svg>
));

// Advantage icon: Budgets — receipt
const IconBudgets = React.memo(() => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path d={ICON_BG} fill="white" fillOpacity={0.1} />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M24.5625 25.1597C24.0278 24.7061 23.2222 24.7061 22.6875 25.1597C22.1528 25.6134 21.3472 25.6134 20.8125 25.1597C20.2778 24.7061 19.4722 24.7061 18.9375 25.1597C18.4028 25.6134 17.5972 25.6134 17.0625 25.1597C16.5278 24.7061 15.7222 24.7061 15.1875 25.1597C14.6528 25.6134 13.8472 25.6134 13.3125 25.1597C12.7778 24.7061 11.9722 24.7061 11.4375 25.1597C11.0742 25.468 10.5 25.2218 10.5 24.7578V11.2422C10.5 10.7782 11.0742 10.532 11.4375 10.8403C11.9722 11.2939 12.7778 11.2939 13.3125 10.8403C13.8472 10.3866 14.6528 10.3866 15.1875 10.8403C15.7222 11.2939 16.5278 11.2939 17.0625 10.8403C17.5972 10.3866 18.4028 10.3866 18.9375 10.8403C19.4722 11.2939 20.2778 11.2939 20.8125 10.8403C21.3472 10.3866 22.1528 10.3866 22.6875 10.8403C23.2222 11.2939 24.0278 11.2939 24.5625 10.8403C24.9258 10.532 25.5 10.7782 25.5 11.2422V24.7578C25.5 25.2218 24.9258 25.468 24.5625 25.1597ZM13.625 18C13.625 17.6548 13.9048 17.375 14.25 17.375H21.75C22.0952 17.375 22.375 17.6548 22.375 18C22.375 18.3452 22.0952 18.625 21.75 18.625H14.25C13.9048 18.625 13.625 18.3452 13.625 18ZM14.25 14.4583C13.9048 14.4583 13.625 14.7382 13.625 15.0833C13.625 15.4285 13.9048 15.7083 14.25 15.7083H21.75C22.0952 15.7083 22.375 15.4285 22.375 15.0833C22.375 14.7382 22.0952 14.4583 21.75 14.4583H14.25ZM13.625 20.9167C13.625 20.5715 13.9048 20.2917 14.25 20.2917H21.75C22.0952 20.2917 22.375 20.5715 22.375 20.9167C22.375 21.2618 22.0952 21.5417 21.75 21.5417H14.25C13.9048 21.5417 13.625 21.2618 13.625 20.9167Z"
      fill="white"
    />
  </Svg>
));

// Advantage icon: Analytics — chart line
const IconAnalytics = React.memo(() => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path d={ICON_BG} fill="white" fillOpacity={0.1} />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.8869 10.887C9.6665 12.1074 9.6665 14.0716 9.6665 18C9.6665 21.9283 9.6665 23.8925 10.8869 25.1129C12.1073 26.3333 14.0715 26.3333 17.9998 26.3333C21.9282 26.3333 23.8924 26.3333 25.1128 25.1129C26.3332 23.8925 26.3332 21.9283 26.3332 18C26.3332 14.0716 26.3332 12.1074 25.1128 10.887C23.8924 9.66663 21.9282 9.66663 17.9998 9.66663C14.0715 9.66663 12.1073 9.66663 10.8869 10.887ZM22.6466 16.7334C22.8676 16.4682 22.8318 16.0741 22.5666 15.8532C22.3014 15.6322 21.9073 15.668 21.6864 15.9332L20.189 17.7301C19.88 18.1009 19.6902 18.3262 19.5339 18.4674C19.4614 18.5328 19.4184 18.5589 19.3978 18.5689C19.3936 18.5709 19.3906 18.5721 19.3887 18.5728C19.3887 18.5728 19.3852 18.5715 19.3823 18.5702L19.3797 18.5689C19.3591 18.5589 19.3161 18.5328 19.2436 18.4674C19.0872 18.3262 18.8975 18.1009 18.5885 17.7301L18.3448 17.4377C18.0711 17.1091 17.8244 16.813 17.5939 16.6048C17.3431 16.3784 17.0272 16.1767 16.6109 16.1767C16.1947 16.1767 15.8788 16.3784 15.628 16.6048C15.3975 16.813 15.1508 17.1091 14.8771 17.4377L13.353 19.2665C13.1321 19.5317 13.1679 19.9258 13.4331 20.1468C13.6982 20.3677 14.0923 20.3319 14.3133 20.0667L15.8107 18.2699C16.1197 17.8991 16.3095 17.6737 16.4658 17.5325C16.5383 17.4671 16.5813 17.441 16.6019 17.431C16.6041 17.43 16.606 17.4291 16.6075 17.4284L16.6109 17.4271C16.6128 17.4278 16.6158 17.429 16.62 17.431C16.6406 17.441 16.6836 17.4671 16.7561 17.5325C16.9124 17.6737 17.1022 17.8991 17.4112 18.2699L17.6548 18.5623C17.9286 18.8908 18.1753 19.187 18.4058 19.3951C18.6566 19.6216 18.9725 19.8233 19.3887 19.8233C19.805 19.8233 20.1209 19.6216 20.3716 19.3951C20.6021 19.187 20.8489 18.8908 21.1226 18.5623L22.6466 16.7334Z"
      fill="white"
    />
  </Svg>
));

// Advantage icon: Priority — star badge
const IconPriority = React.memo(() => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path d={ICON_BG} fill="white" fillOpacity={0.1} />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.1964 12.8193C18.4504 12.4125 17.5488 12.4125 16.8028 12.8193L12.8076 14.9977C12.0042 15.4358 11.5044 16.2777 11.5044 17.1926V21.3073C11.5044 22.2223 12.0042 23.0642 12.8076 23.5022L16.8028 25.6807C17.5488 26.0875 18.4504 26.0875 19.1964 25.6807L23.1916 23.5022C23.9949 23.0642 24.4948 22.2223 24.4948 21.3073V17.1926C24.4948 16.2777 23.9949 15.4358 23.1916 14.9977L19.1964 12.8193ZM17.9998 16.75C17.763 16.75 17.6047 17.034 17.288 17.6021L17.2061 17.7491C17.1161 17.9105 17.0711 17.9912 17.001 18.0445C16.9308 18.0977 16.8435 18.1175 16.6687 18.157L16.5096 18.193C15.8947 18.3321 15.5873 18.4017 15.5141 18.6369C15.441 18.8722 15.6506 19.1173 16.0698 19.6075L16.1782 19.7343C16.2974 19.8736 16.3569 19.9433 16.3837 20.0294C16.4105 20.1156 16.4015 20.2085 16.3835 20.3944L16.3671 20.5636C16.3037 21.2177 16.272 21.5447 16.4635 21.6901C16.655 21.8354 16.9429 21.7029 17.5187 21.4378L17.6676 21.3692C17.8312 21.2939 17.913 21.2562 17.9998 21.2562C18.0865 21.2562 18.1683 21.2939 18.3319 21.3692L18.4808 21.4378C19.0566 21.7029 19.3445 21.8354 19.536 21.6901C19.7275 21.5447 19.6958 21.2176 19.6324 20.5636L19.616 20.3944C19.598 20.2085 19.589 20.1156 19.6158 20.0294C19.6426 19.9433 19.7021 19.8736 19.8213 19.7343L19.9297 19.6075C20.3489 19.1173 20.5585 18.8722 20.4854 18.6369C20.4123 18.4017 20.1048 18.3321 19.4899 18.193L19.3308 18.157C19.156 18.1175 19.0687 18.0977 18.9985 18.0445C18.9284 17.9912 18.8834 17.9105 18.7934 17.7491L18.7115 17.6021C18.3948 17.034 18.2365 16.75 17.9998 16.75Z"
      fill="white"
    />
    <Path
      d="M17.1668 9.66663H18.8335C20.4048 9.66663 21.1905 9.66663 21.6787 10.1548C22.1668 10.6429 22.1668 11.4286 22.1668 13V13.0149L19.7952 11.7218C18.6762 11.1116 17.3238 11.1116 16.2048 11.7218L13.8335 13.0147V13C13.8335 11.4286 13.8335 10.6429 14.3217 10.1548C14.8098 9.66663 15.5955 9.66663 17.1668 9.66663Z"
      fill="white"
    />
  </Svg>
));

// ═══════════════════════════════════════════════
// Advantage data
// ═══════════════════════════════════════════════

const ADVANTAGES: { Icon: React.FC; labelKey: string }[] = [
  { Icon: IconCategories, labelKey: 'subscription.advantageCategories' },
  { Icon: IconBudgets, labelKey: 'subscription.advantageBudgets' },
  { Icon: IconAnalytics, labelKey: 'subscription.advantageAnalytics' },
  { Icon: IconPriority, labelKey: 'subscription.advantagePriority' },
];

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

type PlanType = 'annual' | 'monthly';

export const SubscriptionManagementScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');

  // Defer heavy glow rendering until after navigation transition completes
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => handle.cancel();
  }, []);

  // Simple opacity animation
  const annualOpacity = useSharedValue(1);
  const monthlyOpacity = useSharedValue(0.6);

  useEffect(() => {
    const isAnnual = selectedPlan === 'annual';
    annualOpacity.value = withTiming(isAnnual ? 1 : 0.6, { duration: 200 });
    monthlyOpacity.value = withTiming(isAnnual ? 0.6 : 1, { duration: 200 });
  }, [selectedPlan]);

  const annualCardStyle = useAnimatedStyle(() => ({
    opacity: annualOpacity.value,
  }));

  const monthlyCardStyle = useAnimatedStyle(() => ({
    opacity: monthlyOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent />

      {/* Background glows — deferred until after transition animation */}
      {isReady && (
        <>
          <View style={styles.glowContainer} pointerEvents="none">
            <GlowCircle1 />
          </View>
          <View style={styles.glow2Container} pointerEvents="none">
            <GlowCircle2 />
          </View>
        </>
      )}

      {/* Fixed header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 16, paddingHorizontal: 24 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.title}>{t('subscription.title')}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Plan cards — side by side */}
        <View style={styles.plansRow}>
          {/* Annual plan */}
          <TouchableOpacity
            style={[styles.planCard]}
            activeOpacity={0.7}
            onPress={() => setSelectedPlan('annual')}
          >
            <Animated.View style={[{ flex: 1, justifyContent: 'space-between' }, annualCardStyle]}>
              {/* Top section */}
              <View>
                {/* Row 1: radio (left) + save badge (right) */}
                <View style={styles.planTopRow}>
                  {selectedPlan === 'annual' ? <RadioCheckedIcon /> : <RadioUncheckedIcon />}
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>{t('subscription.save71')}</Text>
                  </View>
                </View>

                {/* Plan name */}
                <Text style={styles.planName}>{t('subscription.annual')}</Text>

                {/* Trial text */}
                <Text style={styles.trialText}>{t('subscription.freeTrial14')}</Text>
              </View>

              {/* Bottom section — prices pushed to bottom */}
              <View style={styles.planBottom}>
                <Text style={styles.priceMain}>{t('subscription.annualPrice')}</Text>
                <Text style={styles.priceSecondary}>{t('subscription.annualTotal')}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Monthly plan */}
          <TouchableOpacity
            style={[styles.planCard]}
            activeOpacity={0.7}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Animated.View style={[{ flex: 1, justifyContent: 'space-between' }, monthlyCardStyle]}>
              {/* Top section */}
              <View>
                {/* Row 1: radio */}
                <View style={styles.planTopRow}>
                  {selectedPlan === 'monthly' ? <RadioCheckedIcon /> : <RadioUncheckedIcon />}
                </View>

                {/* Plan name */}
                <Text style={styles.planName}>{t('subscription.monthly')}</Text>

                {/* Trial text */}
                <Text style={styles.trialText}>{t('subscription.freeTrial7')}</Text>
              </View>

              {/* Bottom section — price pushed to bottom */}
              <View style={styles.planBottom}>
                <Text style={styles.priceMain}>{t('subscription.monthlyPrice')}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Advantages section */}
        <Text style={styles.advantagesTitle}>{t('subscription.advantages')}</Text>
        <View style={styles.advantagesList}>
          {ADVANTAGES.map((adv, index) => {
            const text = t(adv.labelKey);
            const parts = text.split('|');
            return (
              <View key={index} style={styles.advantageRow}>
                <adv.Icon />
                <Text style={styles.advantageText}>
                  {parts[0]}
                  {parts[1] && (
                    <Text style={styles.advantageTextGrey}>{parts[1]}</Text>
                  )}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{t('subscription.tryFree')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // === Glows (same positions as ProfileScreen) ===
  glowContainer: {
    position: 'absolute',
    left: scale(22 + 175 - GLOW_RENDER_SIZE / 2),
    top: scale(-175 + 175 - GLOW_RENDER_SIZE / 2),
  },
  glow2Container: {
    position: 'absolute',
    left: scale(267.5 - GLOW2_RENDER_SIZE / 2),
    top: scale(-64.5 - GLOW2_RENDER_SIZE / 2),
  },

  // Content area
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Header row — back button + title on same line
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },

  // Back button — 48x48, rgba(255,255,255,0.1), borderRadius 12 (same as auth screens)
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title — 20px medium, on same level as back button
  title: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.white[100],
    flex: 1,
  },

  // Plan cards row
  plansRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
  },

  // Plan card — height 220, flex: 1, content spread top-to-bottom
  planCard: {
    flex: 1,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    padding: 12,
    justifyContent: 'space-between',
  },
  planCardSelected: {},

  // Plan card top row: radio (left) + badge (right)
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planName: {
    fontFamily: fontFamily.regular,
    fontSize: 20,
    lineHeight: 26,
    color: colors.white[100],
    marginBottom: 4,
  },

  // Save badge — pill, next to radio on top row
  saveBadge: {
    backgroundColor: 'rgba(23, 229, 108, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  saveBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.success[700],
  },

  // Trial text
  trialText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white[40],
  },

  // Bottom section of card — prices pushed to bottom
  planBottom: {},
  priceMain: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.white[100],
  },
  priceSecondary: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 18,
    color: '#706E75',
    marginTop: 2,
  },

  // Advantages section title — same as ProfileScreen sectionHeader
  advantagesTitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white[40],
    marginBottom: 12,
  },
  advantagesList: {
    gap: 16,
  },
  advantageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  advantageText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[100],
    flex: 1,
  },
  advantageTextGrey: {
    color: colors.white[40],
  },

  // Bottom CTA
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  ctaButton: {
    backgroundColor: colors.white[100],
    borderRadius: borderRadius.full,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.background,
  },
});
