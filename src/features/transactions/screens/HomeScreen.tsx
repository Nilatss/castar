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

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useShallow } from 'zustand/react/shallow';
import Svg, { Path } from 'react-native-svg';
import { format } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';

import { colors, typography, spacing, borderRadius } from '../../../shared/constants';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../../../shared/constants/scaling';
import { GlowCircle1, GlowCircle2 } from '../../../shared/components/GlowImage';
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
};

// ═══════════════════════════════════════════════
// SVG Icons (JSX — no XML parsing at runtime)
// ═══════════════════════════════════════════════

const ChevronRightIcon = React.memo(({ size = 24, color = colors.textTertiary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));
ChevronRightIcon.displayName = 'ChevronRightIcon';

const PlusCircleIcon = React.memo(({ size = 20, color = colors.text }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M10 1.667C5.398 1.667 1.667 5.398 1.667 10S5.398 18.333 10 18.333 18.333 14.602 18.333 10 14.602 1.667 10 1.667Z"
      stroke={color}
      strokeWidth={1.5}
    />
    <Path
      d="M10 6.667v6.666M13.333 10H6.667"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
));
PlusCircleIcon.displayName = 'PlusCircleIcon';

const VoiceSwirl = React.memo(({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Path
      d="M14 3C8.477 3 4 7.477 4 13s4.477 10 10 10 10-4.477 10-10"
      stroke="white"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Path
      d="M14 8c-2.761 0-5 2.239-5 5s2.239 5 5 5"
      stroke="white"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Path
      d="M14 13h6"
      stroke="white"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </Svg>
));
VoiceSwirl.displayName = 'VoiceSwirl';

// ═══════════════════════════════════════════════
// HomeScreen Component
// ═══════════════════════════════════════════════

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  // ── State ──
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('7D');

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
            <ChevronRightIcon size={24} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Budget amount */}
          <Text style={styles.budgetAmount}>
            {formatCurrency(budgetAmount, currency)}
          </Text>

          {/* Period pills */}
          <View style={styles.periodRow}>
            {PERIODS.map((period) => {
              const isActive = period === selectedPeriod;
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodPill,
                    isActive && styles.periodPillActive,
                  ]}
                  onPress={() => handlePeriodPress(period)}
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

          {/* Spent / Remaining sub-cards */}
          <View style={styles.subCardsRow}>
            {/* Spent */}
            <TouchableOpacity style={styles.subCard} activeOpacity={0.7}>
              <Text style={styles.subCardLabel}>{t('home.spent')}</Text>
              <View style={styles.subCardValueRow}>
                <Text style={styles.subCardValue}>
                  -{formatCurrency(spent, currency)}
                </Text>
                <ChevronRightIcon size={20} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>

            {/* Remaining */}
            <TouchableOpacity style={styles.subCard} activeOpacity={0.7}>
              <Text style={styles.subCardLabel}>{t('home.remaining')}</Text>
              <View style={styles.subCardValueRow}>
                <Text style={styles.subCardValue}>
                  {formatCurrency(remaining >= 0 ? remaining : 0, currency)}
                </Text>
                <ChevronRightIcon size={20} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Floating Bottom Actions ── */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 80 }]}>
        <TouchableOpacity
          style={styles.addManuallyButton}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <PlusCircleIcon size={20} color={colors.text} />
          <Text style={styles.addManuallyText}>{t('home.addManually')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoicePress}
          activeOpacity={0.7}
        >
          <VoiceSwirl size={28} />
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
    paddingTop: spacing.lg,
    paddingBottom: 160,
  },

  // ── Date ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  dayNumber: {
    ...typography.heading2,
    color: colors.text,
  },
  monthName: {
    ...typography.heading5,
    color: colors.textTertiary,
  },

  // ── Greeting ──
  greeting: {
    ...typography.heading1,
    color: colors.text,
    marginBottom: spacing.xl,
  },

  // ── Budget Card ──
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  budgetBadge: {
    backgroundColor: colors.neutral[800],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  budgetBadgeText: {
    ...typography.captionMedium,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Budget Amount ──
  budgetAmount: {
    ...typography.heading1,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  // ── Period Pills ──
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodPill: {
    backgroundColor: colors.neutral[800],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillActive: {
    backgroundColor: colors.neutral[600],
  },
  periodPillText: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
  periodPillTextActive: {
    color: colors.text,
  },

  // ── Sub Cards ──
  subCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  subCard: {
    flex: 1,
    backgroundColor: colors.neutral[800],
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    gap: spacing.xs,
  },
  subCardLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  subCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCardValue: {
    ...typography.bodyLargeSemiBold,
    color: colors.text,
    flex: 1,
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
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  addManuallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[800],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addManuallyText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
