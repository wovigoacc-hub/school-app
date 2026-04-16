// ─── Palette — raw colour values ─────────────────────────────────────────────
// Never use these directly in components — use semantic tokens below

const palette = {
    // Blue (primary brand)
    blue50: '#eff6ff',
    blue100: '#dbeafe',
    blue200: '#bfdbfe',
    blue300: '#93c5fd',
    blue400: '#60a5fa',
    blue500: '#3b82f6',
    blue600: '#2563eb',
    blue700: '#1d4ed8',
    blue800: '#1e40af',
    blue900: '#1e3a8a',

    // Green
    green50: '#f0fdf4',
    green100: '#dcfce7',
    green200: '#bbf7d0',
    green500: '#22c55e',
    green600: '#16a34a',
    green700: '#15803d',
    green800: '#166534',

    // Red
    red50: '#fef2f2',
    red100: '#fee2e2',
    red200: '#fecaca',
    red500: '#ef4444',
    red600: '#dc2626',
    red700: '#b91c1c',
    red800: '#991b1b',

    // Amber / Warning
    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber500: '#f59e0b',
    amber600: '#d97706',
    amber700: '#b45309',

    // Purple
    purple50: '#faf5ff',
    purple100: '#f3e8ff',
    purple500: '#a855f7',
    purple600: '#9333ea',
    purple700: '#7e22ce',

    // Cyan
    cyan50: '#ecfeff',
    cyan500: '#06b6d4',
    cyan600: '#0891b2',

    // Grey scale
    white: '#ffffff',
    grey50: '#f9fafb',
    grey100: '#f3f4f6',
    grey200: '#e5e7eb',
    grey300: '#d1d5db',
    grey400: '#9ca3af',
    grey500: '#6b7280',
    grey600: '#4b5563',
    grey700: '#374151',
    grey800: '#1f2937',
    grey900: '#111827',
    black: '#000000',
} as const;

// ─── Semantic tokens — light mode ─────────────────────────────────────────────

export const Colors = {
    // ─── Brand ─────────────────────────────────────────────────────────────
    primary: palette.blue600,
    primaryLight: palette.blue500,
    primaryDark: palette.blue700,
    primarySubtle: palette.blue50,
    primaryBorder: palette.blue200,

    // ─── Backgrounds ───────────────────────────────────────────────────────
    background: palette.grey50,      // app background
    surface: palette.white,       // cards, sheets
    surfaceSecondary: palette.grey100,    // subtle cards, chips
    surfaceElevated: palette.white,       // modals, bottom sheets

    // ─── Text ──────────────────────────────────────────────────────────────
    textPrimary: palette.grey900,
    textSecondary: palette.grey600,
    textTertiary: palette.grey400,
    textInverse: palette.white,
    textLink: palette.blue600,
    textDanger: palette.red600,

    // ─── Borders ───────────────────────────────────────────────────────────
    border: palette.grey200,
    borderStrong: palette.grey300,
    borderFocus: palette.blue500,

    // ─── Status — semantic ─────────────────────────────────────────────────
    success: palette.green600,
    successLight: palette.green50,
    successBorder: palette.green200,

    warning: palette.amber600,
    warningLight: palette.amber50,
    warningBorder: palette.amber200,

    error: palette.red600,
    errorLight: palette.red50,
    errorBorder: palette.red200,

    info: palette.blue600,
    infoLight: palette.blue50,
    infoBorder: palette.blue200,

    // ─── Attendance status colours ─────────────────────────────────────────
    present: palette.green600,
    presentBg: palette.green100,
    absent: palette.red600,
    absentBg: palette.red100,
    late: palette.amber600,
    lateBg: palette.amber100,
    leave: palette.blue600,
    leaveBg: palette.blue100,
    halfDay: palette.purple600,
    halfDayBg: palette.purple100,

    // ─── Role colours ──────────────────────────────────────────────────────
    teacher: palette.blue600,
    teacherLight: palette.blue50,
    parent: palette.purple600,
    parentLight: palette.purple50,

    // ─── Grade colours ─────────────────────────────────────────────────────
    gradeAPlus: palette.green700,
    gradeA: palette.green600,
    gradeBPlus: '#65a30d',       // lime-600
    gradeB: palette.amber600,
    gradeC: '#ea580c',       // orange-600
    gradeD: palette.red500,
    gradeF: palette.red700,

    // ─── Tab bar ───────────────────────────────────────────────────────────
    tabBarActive: palette.blue600,
    tabBarInactive: palette.grey400,
    tabBarBg: palette.white,
    tabBarBorder: palette.grey200,

    // ─── Navigation header ─────────────────────────────────────────────────
    headerBg: palette.white,
    headerText: palette.grey900,
    headerBorder: palette.grey200,

    // ─── Input ─────────────────────────────────────────────────────────────
    inputBg: palette.white,
    inputBorder: palette.grey300,
    inputBorderFocus: palette.blue500,
    inputBorderError: palette.red500,
    inputPlaceholder: palette.grey400,
    inputText: palette.grey900,

    // ─── Button ────────────────────────────────────────────────────────────
    buttonPrimary: palette.blue600,
    buttonPrimaryText: palette.white,
    buttonSecondary: palette.white,
    buttonSecondaryText: palette.blue600,
    buttonSecondaryBorder: palette.blue600,
    buttonDestructive: palette.red600,
    buttonDestructiveText: palette.white,
    buttonDisabled: palette.grey200,
    buttonDisabledText: palette.grey400,

    // ─── Badge / Chip ──────────────────────────────────────────────────────
    badgeEmergency: palette.red600,
    badgeEmergencyBg: palette.red50,

    // ─── Skeleton loading ──────────────────────────────────────────────────
    skeletonBase: palette.grey200,
    skeletonHighlight: palette.grey100,

    // ─── Overlay ───────────────────────────────────────────────────────────
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',

    // ─── Grey scale ──────────────────────────────────────────────────────────
    grey50: palette.grey50,
    grey100: palette.grey100,
    grey200: palette.grey200,
    grey300: palette.grey300,
    grey400: palette.grey400,
    grey500: palette.grey500,
    grey600: palette.grey600,
    grey700: palette.grey700,
    grey800: palette.grey800,
    grey900: palette.grey900,
    white: palette.white,
    black: palette.black,

    // ─── Transparent ───────────────────────────────────────────────────────
    transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;

// ─── NativeWind / Tailwind colour config extension ───────────────────────────
// Use this in tailwind.config.js → theme.extend.colors

export const tailwindColors = {
    primary: Colors.primary,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    present: Colors.present,
    absent: Colors.absent,
    late: Colors.late,
    leave: Colors.leave,
    'half-day': Colors.halfDay,
    teacher: Colors.teacher,
    parent: Colors.parent,
} as const;

// ─── Announcement type colours ────────────────────────────────────────────────

export const ANNOUNCEMENT_COLORS = {
    GENERAL: { text: palette.grey600, bg: palette.grey100 },
    CIRCULAR: { text: palette.blue700, bg: palette.blue50 },
    HOLIDAY: { text: palette.green700, bg: palette.green50 },
    EVENT: { text: palette.purple700, bg: palette.purple50 },
    EXAM_SCHEDULE: { text: palette.amber700, bg: palette.amber50 },
    PARENT_MEETING: { text: palette.cyan600, bg: palette.cyan50 },
    EMERGENCY: { text: palette.red700, bg: palette.red50 },
} as const;

// ─── Request status colours ───────────────────────────────────────────────────

export const REQUEST_STATUS_COLORS = {
    SUBMITTED: { text: palette.grey600, bg: palette.grey100 },
    UNDER_REVIEW: { text: palette.amber700, bg: palette.amber50 },
    RESPONDED: { text: palette.blue700, bg: palette.blue50 },
    CLOSED: { text: palette.green700, bg: palette.green50 },
} as const;

// ─── Priority colours ─────────────────────────────────────────────────────────

export const PRIORITY_COLORS = {
    LOW: { text: palette.grey600, bg: palette.grey100 },
    MEDIUM: { text: palette.blue700, bg: palette.blue50 },
    HIGH: { text: palette.amber700, bg: palette.amber50 },
    URGENT: { text: palette.red700, bg: palette.red50 },
} as const;

export { palette };