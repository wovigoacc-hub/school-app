import { Language } from './auth.types';

// ─── Notification preferences ─────────────────────────────────────────────────
// Mirrors backend NotificationPrefsDto

export interface NotificationPreferences {
    absenceAlerts: true;    // always ON — read-only
    emergencyBroadcasts: true;    // always ON — read-only
    muteHomeworkReminders: boolean;
    muteWeeklySummary: boolean;
}

// ─── Update notification prefs request ───────────────────────────────────────

export interface UpdateNotificationPrefsRequest {
    muteHomeworkReminders?: boolean;
    muteWeeklySummary?: boolean;
}

// ─── Device token registration ────────────────────────────────────────────────

export interface RegisterDeviceTokenRequest {
    token: string;
    platform: 'ios' | 'android';
}

// ─── Generic name/id pair used in dropdowns ──────────────────────────────────

export interface SelectOption {
    id: string;
    label: string;
    value: string;
}