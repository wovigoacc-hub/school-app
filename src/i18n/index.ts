import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ─── English resources ────────────────────────────────────────────────────────

import enCommon from './en/common.json';
import enAttendance from './en/attendance.json';
import enHomework from './en/homework.json';

// ─── Tamil resources ──────────────────────────────────────────────────────────

import taCommon from './ta/common.json';

// ─── Malayalam resources ──────────────────────────────────────────────────────

import mlCommon from './ml/common.json';

// ─── Resource map ─────────────────────────────────────────────────────────────

const resources = {
    en: {
        common: enCommon,
        attendance: enAttendance,
        homework: enHomework,
    },
    ta: {
        // Tamil only provides common + attendance overrides.
        // Everything else falls back to English via the fallbackLng chain.
        common: { ...enCommon, ...taCommon },
        attendance: {
            ...enAttendance, ...(taCommon as any).attendance
                ? { attendance: (taCommon as any).attendance }
                : {}
        },
        homework: enHomework,
    },
    ml: {
        common: { ...enCommon, ...mlCommon },
        attendance: enAttendance,
        homework: enHomework,
    },
} as const;

// ─── Map app Language enum → i18next locale code ──────────────────────────────

export const LANGUAGE_TO_LOCALE: Record<string, string> = {
    ENGLISH: 'en',
    TAMIL: 'ta',
    MALAYALAM: 'ml',
};

// ─── Initialise i18next ───────────────────────────────────────────────────────

i18n
    .use(initReactI18next)
    .init({
        resources,

        // Default language
        lng: 'en',

        // Fallback chain: any missing ta/ml key falls back to en
        fallbackLng: 'en',

        // Default namespace — used when no ns prefix is given
        defaultNS: 'common',

        // Namespaces available
        ns: ['common', 'attendance', 'homework'],

        interpolation: {
            // React already escapes values — no need for i18next to do it
            escapeValue: false,
        },

        // Pluralisation separator for simple cases (e.g. "key_plural")
        pluralSeparator: '_',

        // Don't log missing keys in production
        saveMissing: __DEV__,

        // In dev, log missing key to console so we can add it
        missingKeyHandler: __DEV__
            ? (lngs, ns, key) => {
                console.warn(`[i18n] Missing key: ${ns}:${key} (lng: ${lngs.join(', ')})`);
            }
            : undefined,
    });

/**
 * Change the active language at runtime.
 * Called from useAuth.updateLocalProfile / profile screen language picker.
 */
export function changeLanguage(appLang: string): void {
    const locale = LANGUAGE_TO_LOCALE[appLang] ?? 'en';
    i18n.changeLanguage(locale);
}

export default i18n;