import { Platform } from 'react-native';

// ─── App identity ─────────────────────────────────────────────────────────────

export const APP_CONFIG = {
    APP_NAME: 'SchoolBridge',
    APP_VERSION: '1.0.0',
    BUNDLE_ID: Platform.select({
        ios: 'com.schoolbridge.app',
        android: 'com.schoolbridge.app',
        default: 'com.schoolbridge.app',
    }),
    SUPPORT_EMAIL: 'support@schoolbridge.in',
    WEBSITE: 'https://schoolbridge.in',
} as const;

// ─── Auth & token config ──────────────────────────────────────────────────────

export const AUTH_CONFIG = {
    // Keychain service name — all tokens stored under this namespace
    KEYCHAIN_SERVICE: 'com.schoolbridge.auth',

    // How many seconds before token expiry to proactively refresh
    TOKEN_REFRESH_BUFFER_SECS: 60,

    // Maximum number of silent refresh retry attempts
    MAX_REFRESH_RETRIES: 2,

    // Session idle timeout (ms) — prompt re-auth if app is backgrounded longer
    SESSION_IDLE_TIMEOUT_MS: 30 * 60 * 1000,   // 30 minutes
} as const;

// ─── API config ───────────────────────────────────────────────────────────────

export const API_CONFIG = {
    // Request timeout in milliseconds
    TIMEOUT_MS: 15_000,   // 15 seconds

    // How long RTK Query keeps cache alive (seconds) before re-fetching
    CACHE_LIFETIME_SECS: 60,       // 1 minute

    // Maximum retry attempts on network failure
    MAX_RETRIES: 3,

    // File upload timeout (larger files need more time)
    UPLOAD_TIMEOUT_MS: 120_000,    // 2 minutes
} as const;

// ─── Notification / push config ───────────────────────────────────────────────

export const NOTIFICATION_CONFIG = {
    // Quiet hours — notifications queued, not delivered during these hours
    QUIET_HOURS_START: 22,   // 10 PM
    QUIET_HOURS_END: 7,    // 7 AM

    // Background fetch interval for unread count (seconds)
    UNREAD_POLL_INTERVAL_SECS: 60,

    // How many notifications to show in the inbox per page
    INBOX_PAGE_SIZE: 20,

    // Max notification age to show in inbox (days)
    INBOX_MAX_AGE_DAYS: 30,
} as const;

// ─── Attendance config ────────────────────────────────────────────────────────

export const ATTENDANCE_CONFIG = {
    // Default lock time if school config is not yet loaded
    DEFAULT_LOCK_TIME: '17:00',

    // Default threshold percentage
    DEFAULT_THRESHOLD_PCT: 75,

    // Minimum days of data before showing threshold warning
    MIN_DAYS_FOR_THRESHOLD: 10,

    // Offline attendance queue — max sessions to store locally
    MAX_OFFLINE_SESSIONS: 5,
} as const;

// ─── File upload config ───────────────────────────────────────────────────────

export const FILE_CONFIG = {
    // Maximum file sizes (bytes)
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,   // 5 MB
    MAX_PDF_SIZE_BYTES: 10 * 1024 * 1024,   // 10 MB
    MAX_HOMEWORK_SIZE_BYTES: 10 * 1024 * 1024,  // 10 MB

    // Presigned URL expiry (seconds)
    PRESIGNED_URL_EXPIRY_SECS: 900,   // 15 minutes

    // Signed download URL expiry (seconds)
    DOWNLOAD_URL_EXPIRY_SECS: 3600,   // 1 hour

    // Allowed image MIME types for profile photos
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],

    // Allowed document MIME types
    ALLOWED_DOC_TYPES: ['application/pdf'] as string[],

    // ImageKit URL endpoint (override in production)
    IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/schoolbridge',

    // ImageKit public key (safe to expose client-side)
    IMAGEKIT_PUBLIC_KEY: 'public_schoolbridge_key_here',
} as const;

// ─── Pagination defaults ──────────────────────────────────────────────────────

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    HOMEWORK_LIMIT: 20,
    ANNOUNCEMENTS_LIMIT: 20,
    REQUESTS_LIMIT: 20,
    NOTIFICATIONS_LIMIT: 20,
    MARKS_HISTORY_LIMIT: 10,
} as const;

// ─── UI config ────────────────────────────────────────────────────────────────

export const UI_CONFIG = {
    // Toast auto-dismiss duration (ms)
    TOAST_DURATION_SUCCESS: 3000,
    TOAST_DURATION_ERROR: 4000,
    TOAST_DURATION_WARNING: 4000,
    TOAST_DURATION_INFO: 3000,

    // Maximum toasts visible at once
    MAX_VISIBLE_TOASTS: 3,

    // Bottom sheet snap points
    BOTTOM_SHEET_SNAP_HALF: '50%',
    BOTTOM_SHEET_SNAP_FULL: '90%',

    // Skeleton loading pulse animation duration (ms)
    SKELETON_DURATION_MS: 1200,

    // Debounce delay for search inputs (ms)
    SEARCH_DEBOUNCE_MS: 300,

    // Pull-to-refresh min pull distance
    REFRESH_PULL_DISTANCE: 60,

    // List end-reached threshold for pagination (0–1)
    PAGINATION_THRESHOLD: 0.3,

    // Animation duration defaults (ms)
    ANIMATION_FAST: 150,
    ANIMATION_NORMAL: 250,
    ANIMATION_SLOW: 400,
} as const;

// ─── Request (parent request) config ─────────────────────────────────────────

export const REQUEST_CONFIG = {
    // Maximum message length per thread message
    MAX_MESSAGE_LENGTH: 2000,

    // Maximum subject line length
    MAX_SUBJECT_LENGTH: 200,

    // Maximum description length
    MAX_DESCRIPTION_LENGTH: 2000,

    // SLA warning — show amber badge when within this % of deadline
    SLA_WARNING_THRESHOLD_PCT: 80,
} as const;

// ─── Homework config ──────────────────────────────────────────────────────────

export const HOMEWORK_CONFIG = {
    // Parent feed rolling archive window (days)
    PARENT_FEED_ARCHIVE_DAYS: 90,

    // Maximum title length
    MAX_TITLE_LENGTH: 200,

    // Maximum instructions length
    MAX_INSTRUCTIONS_LENGTH: 2000,
} as const;

// ─── Marks config ─────────────────────────────────────────────────────────────

export const MARKS_CONFIG = {
    // Percentage below which a mark is flagged as a potential outlier
    OUTLIER_THRESHOLD_PCT: 10,

    // Grade thresholds (must match backend computeGrade())
    GRADE_THRESHOLDS: {
        A_PLUS: 90,
        A: 80,
        B_PLUS: 70,
        B: 60,
        C: 50,
        D: 35,
        // F: below 35
    } as const,
} as const;

// ─── Deep link scheme ─────────────────────────────────────────────────────────

export const DEEP_LINK = {
    SCHEME: 'schoolbridge',
    HOST: 'app',
    // e.g. schoolbridge://app/announcement/uuid
    PREFIXES: ['schoolbridge://app', 'https://app.schoolbridge.in'],
} as const;

// ─── Build-time flags ─────────────────────────────────────────────────────────

export const BUILD_FLAGS = {
    IS_DEV: __DEV__,
    ENABLE_REACTOTRON: __DEV__,
    ENABLE_FLIPPER: __DEV__ && Platform.OS === 'ios',
    LOG_API_CALLS: __DEV__,
} as const;