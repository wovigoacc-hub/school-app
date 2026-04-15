import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export { SCREEN_WIDTH, SCREEN_HEIGHT };

// ─── Spacing scale (4pt grid) ─────────────────────────────────────────────────
// All layout spacing derived from multiples of 4

export const Spacing = {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
} as const;

export type SpacingKey = keyof typeof Spacing;

// ─── Named semantic spacers ───────────────────────────────────────────────────

export const Layout = {
    // Screen edge padding
    screenPaddingH: Spacing[4],    // 16
    screenPaddingV: Spacing[4],    // 16

    // Card internal padding
    cardPaddingH: Spacing[4],    // 16
    cardPaddingV: Spacing[3],    // 12

    // Section spacing (between major sections on a screen)
    sectionGap: Spacing[6],    // 24

    // List item spacing
    listItemGap: Spacing[2],    // 8
    listItemPaddingH: Spacing[4],    // 16
    listItemPaddingV: Spacing[3],    // 12

    // Input
    inputPaddingH: Spacing[4],    // 16
    inputPaddingV: Spacing[3],    // 12
    inputGap: Spacing[4],    // 16 between form fields

    // Button
    buttonPaddingH: Spacing[6],    // 24
    buttonPaddingV: Spacing[3],    // 12
    buttonHeight: 52,
    buttonHeightSm: 40,
    buttonHeightLg: 56,

    // Tab bar height (safe area not included)
    tabBarHeight: Platform.select({ ios: 84, android: 64, default: 64 })!,

    // Header height
    headerHeight: Platform.select({ ios: 44, android: 56, default: 56 })!,

    // Bottom sheet
    bottomSheetHandleH: 24,

    // Minimum touch target (WCAG / Apple HIG)
    minTouchTarget: 44,
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

export const BorderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,   // pill / circle
} as const;

export type BorderRadiusKey = keyof typeof BorderRadius;

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Cross-platform: iOS uses shadowX, Android uses elevation

export const Shadow = {
    none: Platform.select({
        ios: { shadowColor: 'transparent', shadowOpacity: 0 },
        android: { elevation: 0 },
    })!,

    sm: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
        },
        android: { elevation: 1 },
    })!,

    md: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
        },
        android: { elevation: 3 },
    })!,

    lg: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
        },
        android: { elevation: 6 },
    })!,

    xl: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.16,
            shadowRadius: 16,
        },
        android: { elevation: 12 },
    })!,
} as const;

export type ShadowKey = keyof typeof Shadow;

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const ZIndex = {
    base: 0,
    raised: 10,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    toast: 500,
    tooltip: 600,
} as const;

// ─── Icon sizes ───────────────────────────────────────────────────────────────

export const IconSize = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 40,
} as const;

export type IconSizeKey = keyof typeof IconSize;

// ─── Avatar sizes ─────────────────────────────────────────────────────────────

export const AvatarSize = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
    '3xl': 96,
} as const;

export type AvatarSizeKey = keyof typeof AvatarSize;

// ─── Hit slop (enlarges touch target without affecting layout) ────────────────

export const HitSlop = {
    sm: { top: 4, right: 4, bottom: 4, left: 4 },
    md: { top: 8, right: 8, bottom: 8, left: 8 },
    lg: { top: 12, right: 12, bottom: 12, left: 12 },
    xl: { top: 16, right: 16, bottom: 16, left: 16 },
} as const;

// ─── Responsive helpers ───────────────────────────────────────────────────────

export const isSmallScreen = SCREEN_WIDTH < 375;
export const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeScreen = SCREEN_WIDTH >= 414;
export const isShortScreen = SCREEN_HEIGHT < 700;

/**
 * Scale a value based on screen width relative to the 375pt design baseline
 * Useful for font sizes or spacing on very small/large screens
 */
export function scale(size: number): number {
    const baseLine = 375;
    const ratio = SCREEN_WIDTH / baseLine;
    return Math.round(size * ratio);
}

/**
 * Moderately scale — applies scaling with a damping factor (0–1)
 * 0 = no scaling, 1 = full linear scaling
 */
export function moderateScale(size: number, factor = 0.5): number {
    return size + (scale(size) - size) * factor;
}