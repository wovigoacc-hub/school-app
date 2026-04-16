import { Platform } from 'react-native';

/**
 * ─── Font Sizes ─────────────────────────────────────────────────────────────
 */
export const FontSize = {
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
} as const;

/**
 * ─── Font Weights ────────────────────────────────────────────────────────────
 */
export const FontWeight = {
    thin: '100',
    extraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
} as const;

/**
 * ─── Font Families ───────────────────────────────────────────────────────────
 * Platform-specific system font names for localized text
 */
export const FontFamily = {
    tamil: Platform.select({ ios: 'Tamil Sangam MN', android: 'sans-serif', default: undefined }),
    malayalam: Platform.select({ ios: 'Malayalam Sangam MN', android: 'sans-serif', default: undefined }),
} as const;

/**
 * ─── Text Styles (Variants) ─────────────────────────────────────────────────
 * Named presets used by AppText.tsx
 */
export const TextStyles = {
    h1: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        lineHeight: 44,
    },
    h2: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        lineHeight: 36,
    },
    h3: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        lineHeight: 32,
    },
    h4: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semiBold,
        lineHeight: 28,
    },
    subtitle1: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        lineHeight: 24,
    },
    subtitle2: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.medium,
        lineHeight: 22,
    },
    body1: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.regular,
        lineHeight: 24,
    },
    body2: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.regular,
        lineHeight: 20,
    },
    button: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.semiBold,
        lineHeight: 16,
    },
    caption: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.regular,
        lineHeight: 16,
    },
    overline: {
        fontSize: FontSize.xxs,
        fontWeight: FontWeight.bold,
        lineHeight: 14,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
    },
    label: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.medium,
        lineHeight: 20,
    },
    labelSmall: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
        lineHeight: 18,
    },
    numeric: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semiBold,
        lineHeight: 22,
    },
    mono: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    },
} as const;

export type TextStyleKey = keyof typeof TextStyles;