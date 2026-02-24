/**
 * Castar — Home Screen
 *
 * Layout (from Figma):
 * ┌──────────────────────────────────────────────────┐
 * │  23 February                                      │
 * │  Hi, Nilats                                       │
 * │  ┌──────────────────────────────────────────┐    │
 * │  │  [MONTHLY BUDGET]                    ›   │    │
 * │  │  500,000$                                │    │
 * │  │  [1D] [7D*] [14D] [30D]                 │    │
 * │  │  ┌──────────┐ ┌────────────┐             │    │
 * │  │  │Spent    ›│ │Remaining  ›│             │    │
 * │  │  │-130.000$ │ │370.000$    │             │    │
 * │  │  └──────────┘ └────────────┘             │    │
 * │  └──────────────────────────────────────────┘    │
 * │                                                   │
 * │         [⊕ Add manually]  [🌀 Voice]             │
 * │  [Home*]  [Monitoring]  [Tasks]  [Profile]       │
 * └──────────────────────────────────────────────────┘
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useShallow } from 'zustand/react/shallow';
import Svg, { Path } from 'react-native-svg';
import { format } from 'date-fns';
import { enUS, ru, uz, be, uk, kk, de, az, pl, ka, zhCN } from 'date-fns/locale';

import { colors, typography, spacing, borderRadius, fontFamily } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { GlowCircle1, GlowCircle2 } from '../../../shared/components/GlowImage';
import { LogoIcon } from '../../../shared/components/svg/AuthSvgs';
import type { HomeStackParamList } from '../../../shared/types';
import { useAuthStore } from '../../auth/store/authStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { useBudgetStore } from '../../budget/store/budgetStore';
import { useTransactionStore } from '../store/transactionStore';
import { formatCurrency } from '../../../shared/utils/formatCurrency';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

type PeriodFilter = '1D' | '7D' | '14D' | '30D';

const PERIODS: PeriodFilter[] = ['1D', '7D', '14D', '30D'];

const PERIOD_DAYS: Record<PeriodFilter, number> = {
  '1D': 1,
  '7D': 7,
  '14D': 14,
  '30D': 30,
};

// ═══════════════════════════════════════════════
// Locale map for date-fns
// ═══════════════════════════════════════════════

const dateLocales: Record<string, typeof enUS> = {
  en: enUS,
  ru: ru,
  uz: uz,
  be: be,
  uk: uk,
  kk: kk,
  de: de,
  az: az,
  pl: pl,
  ka: ka,
  zh: zhCN,
};

// ═══════════════════════════════════════════════
// SVG Icons (JSX — no XML parsing at runtime)
// ═══════════════════════════════════════════════

const ChevronRightIcon = React.memo(({ size = 24, color = '#F6F6F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5L15 12L9 19"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));
ChevronRightIcon.displayName = 'ChevronRightIcon';

const AddCircleIcon = React.memo(({ size = 24, color = '#F6F6F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 9C12.75 8.58579 12.4142 8.25 12 8.25C11.5858 8.25 11.25 8.58579 11.25 9L11.25 11.25H9C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75H11.25V15C11.25 15.4142 11.5858 15.75 12 15.75C12.4142 15.75 12.75 15.4142 12.75 15L12.75 12.75H15C15.4142 12.75 15.75 12.4142 15.75 12C15.75 11.5858 15.4142 11.25 15 11.25H12.75V9Z"
      fill={color}
    />
  </Svg>
));
AddCircleIcon.displayName = 'AddCircleIcon';


// ═══════════════════════════════════════════════
// HomeScreen Component
// ═══════════════════════════════════════════════

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  // ── State ──
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('7D');
  const [pillWidth, setPillWidth] = useState(0);

  // ── Animated period indicator ──
  const selectedIndex = PERIODS.indexOf(selectedPeriod);
  const indicatorX = useSharedValue(selectedIndex * (pillWidth + 4));

  useEffect(() => {
    indicatorX.value = withTiming(selectedIndex * (pillWidth + 4), {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedIndex, pillWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handlePillLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== pillWidth) setPillWidth(w);
  }, [pillWidth]);

  // ── Store data ──
  const displayName = useAuthStore(useShallow((s) => s.displayName));
  const currency = useProfileStore(useShallow((s) => s.currency));
  const budgets = useBudgetStore(useShallow((s) => s.budgets));
  const transactions = useTransactionStore(useShallow((s) => s.transactions));

  // ── Derived data ──
  const now = new Date();
  const locale = dateLocales[i18n.language] || enUS;
  const dayNumber = format(now, 'd');
  const monthName = format(now, 'MMMM', { locale });

  const activeBudget = useMemo(
    () => budgets.find((b) => b.isActive && b.period === 'monthly') ?? null,
    [budgets],
  );

  const spent = useMemo(() => {
    if (!activeBudget) return 0;
    const days = PERIOD_DAYS[selectedPeriod];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return transactions
      .filter((t) => t.type === 'expense' && t.date >= cutoff)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedPeriod, activeBudget]);

  const budgetAmount = activeBudget?.amount ?? 0;
  const remaining = budgetAmount - spent;

  // ── Handlers ──
  const handlePeriodPress = useCallback((period: PeriodFilter) => {
    setSelectedPeriod(period);
  }, []);

  const handleAddManually = useCallback(() => {
    navigation.navigate('AddTransaction');
  }, [navigation]);

  const handleBudgetCardPress = useCallback(() => {
    // TODO: navigate to BudgetDetail when implemented
  }, []);

  const handleVoicePress = useCallback(() => {
    // TODO: voice input, future feature
  }, []);

  // ═══════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Background Glows (GPU-accelerated PNG) ── */}
      <View style={styles.glowContainer} pointerEvents="none">
        <GlowCircle1 />
      </View>
      <View style={styles.glow2Container} pointerEvents="none">
        <GlowCircle2 />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Date ── */}
        <View style={styles.dateRow}>
          <Text style={styles.dayNumber}>{dayNumber}</Text>
          <Text style={styles.monthName}>{' '}{monthName}</Text>
        </View>

        {/* ── Greeting ── */}
        <Text style={styles.greeting}>
          {t('home.greeting')}, {displayName || t('profile.guest')}
        </Text>

        {/* ── Budget Card ── */}
        <View style={styles.budgetCard}>
          {/* Header row: badge + chevron */}
          <TouchableOpacity
            style={styles.budgetHeader}
            onPress={handleBudgetCardPress}
            activeOpacity={0.7}
          >
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetBadgeText}>
                {t('home.monthlyBudget')}
              </Text>
            </View>
            <ChevronRightIcon size={24} />
          </TouchableOpacity>

          {/* Budget amount */}
          <Text style={styles.budgetAmount}>
            {formatCurrency(budgetAmount, currency)}
          </Text>

          {/* Period pills */}
          <View style={styles.periodContainer}>
            {/* Animated sliding indicator */}
            {pillWidth > 0 && (
              <Animated.View
                style={[
                  styles.periodIndicator,
                  { width: pillWidth, height: 35 },
                  indicatorStyle,
                ]}
              />
            )}
            {PERIODS.map((period, index) => {
              const isActive = period === selectedPeriod;
              return (
                <TouchableOpacity
                  key={period}
                  style={styles.periodPill}
                  onPress={() => handlePeriodPress(period)}
                  onLayout={index === 0 ? handlePillLayout : undefined}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      isActive && styles.periodPillTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Spent / Remaining sub-cards (1:1 settingsField style) */}
          <View style={styles.subCardsRow}>
            {/* Spent */}
            <TouchableOpacity style={styles.subCard} activeOpacity={0.7}>
              <View style={styles.subCardTexts}>
                <Text style={styles.subCardLabel}>{t('home.spent')}</Text>
                <Text style={styles.subCardValue}>
                  -{formatCurrency(spent, currency)}
                </Text>
              </View>
              <ChevronRightIcon size={24} />
            </TouchableOpacity>

            {/* Remaining */}
            <TouchableOpacity style={styles.subCard} activeOpacity={0.7}>
              <View style={styles.subCardTexts}>
                <Text style={styles.subCardLabel}>{t('home.remaining')}</Text>
                <Text style={styles.subCardValue}>
                  {formatCurrency(remaining >= 0 ? remaining : 0, currency)}
                </Text>
              </View>
              <ChevronRightIcon size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Floating Bottom Actions ── */}
      <View style={[styles.bottomActions, { bottom: 32 }]}>
        <TouchableOpacity
          style={styles.addManuallyButton}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <AddCircleIcon size={24} />
          <Text style={styles.addManuallyText}>{t('home.addManually')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoicePress}
          activeOpacity={0.7}
        >
          <LogoIcon width={34} height={32} />
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

  // ── Background Glows ──
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: 160,
  },

  // ── Date ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  dayNumber: {
    fontFamily: fontFamily.medium,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  monthName: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textTertiary,
    flexShrink: 0,
  },

  // ── Greeting ──
  greeting: {
    fontFamily: fontFamily.medium,
    fontSize: 40,
    lineHeight: 40,
    color: colors.text,
    marginBottom: 24,
  },

  // ── Budget Card ──
  budgetCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  budgetBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  budgetBadgeText: {
    ...typography.captionMedium,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Budget Amount ──
  budgetAmount: {
    fontFamily: fontFamily.medium,
    fontSize: 36,
    lineHeight: 36,
    color: colors.text,
    marginBottom: 24,
  },

  // ── Period Pills ──
  periodContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginBottom: 6,
  },
  periodPill: {
    flex: 1,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  periodPillActive: {},
  periodPillText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  periodPillTextActive: {
    fontFamily: fontFamily.medium,
    color: colors.text,
  },

  // ── Sub Cards (1:1 settingsField from ProfileScreen) ──
  subCardsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subCard: {
    flex: 1,
    height: 62,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  subCardTexts: {
    flex: 1,
    gap: 6,
    marginRight: 8,
  },
  subCardLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white[40],
  },
  subCardValue: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white[100],
  },

  // ── Bottom Actions ──
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
  },
  addManuallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[800],
    borderRadius: borderRadius.full,
    paddingLeft: 12,
    paddingRight: 14,
    height: 60,
  },
  addManuallyText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  voiceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
