/**
 * CaStar Design System — Typography
 * Font: Inter (Regular 400, Medium 500, SemiBold 600, Bold 700)
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
} as const;

// Line height = font size (Auto) per Figma spec
export const lineHeight = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
} as const;

/**
 * Pre-composed text styles for convenience.
 * Usage: <Text style={typography.heading1}>Title</Text>
 */
export const typography = {
  // === Headings ===
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight['4xl'],
  },
  heading2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight['3xl'],
  },
  heading3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight['2xl'],
  },
  heading4: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
  },
  heading5: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },

  // === Body ===
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  bodyLargeMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  bodyLargeSemiBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  bodyLargeBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },

  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  bodySemiBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  bodyBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },

  // === Small ===
  small: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  smallMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  smallSemiBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  smallBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },

  // === Caption ===
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
  },
  captionMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
  },
  captionSemiBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
  },
  captionBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
  },
} as const;

export type TypographyStyle = keyof typeof typography;
