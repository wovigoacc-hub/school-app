import * as Keychain from 'react-native-keychain';
import { MMKV } from 'react-native-mmkv';
import type { StoredTokens } from '../types/auth.types';

// ─── Keychain service name ─────────────────────────────────────────────────────
// All token entries are namespaced under this service in iOS Keychain
// and Android EncryptedSharedPreferences / Keystore

const KEYCHAIN_SERVICE = 'com.schoolbridge.auth';

// ─── MMKV instance (non-sensitive fast local storage) ────────────────────────
// Used for: offline queue, active child ID, UI preferences
// NOT for tokens — those go in Keychain

export const mmkv = new MMKV({
    id: 'schoolbridge-store',
    encryptionKey: 'sb-mmkv-key-2025', // static key — non-sensitive data only
});

// ─── Token storage (Keychain) ─────────────────────────────────────────────────

/**
 * Store access + refresh tokens securely in Keychain / Keystore
 * On iOS: stored in the Keychain with kSecAttrAccessibleWhenUnlockedThisDeviceOnly
 * On Android: stored in EncryptedSharedPreferences backed by Android Keystore
 */
export async function storeTokens(tokens: StoredTokens): Promise<boolean> {
    try {
        await Keychain.setGenericPassword(
            tokens.userType,                   // username field = userType
            JSON.stringify(tokens),            // password field = full token payload
            {
                service: KEYCHAIN_SERVICE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
            },
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Retrieve tokens from Keychain
 * Returns null if not found or Keychain access fails
 */
export async function getTokens(): Promise<StoredTokens | null> {
    try {
        const result = await Keychain.getGenericPassword({
            service: KEYCHAIN_SERVICE,
        });

        if (!result || result === false) return null;

        const parsed = JSON.parse(result.password) as StoredTokens;
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Delete tokens from Keychain — called on logout
 */
export async function clearTokens(): Promise<boolean> {
    try {
        await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
        return true;
    } catch {
        return false;
    }
}

/**
 * Update only the access token (after refresh) without touching the refresh token
 */
export async function updateAccessToken(newAccessToken: string): Promise<boolean> {
    try {
        const existing = await getTokens();
        if (!existing) return false;

        return storeTokens({ ...existing, accessToken: newAccessToken });
    } catch {
        return false;
    }
}

/**
 * Check if tokens exist (used on app cold start to decide initial route)
 */
export async function hasStoredTokens(): Promise<boolean> {
    const tokens = await getTokens();
    return tokens !== null;
}

// ─── MMKV helpers — fast non-sensitive storage ────────────────────────────────

const MMKV_KEYS = {
    ACTIVE_CHILD_ID: 'active_child_id',
    PREFERRED_LANG: 'preferred_lang',
    OFFLINE_QUEUE: 'offline_queue',
    LAST_SYNC: 'last_sync',
    PUSH_TOKEN: 'push_token',
    ONBOARDED: 'onboarded',
} as const;

// Active child (parent role — which child is selected in switcher)

export function setActiveChildId(studentId: string): void {
    mmkv.set(MMKV_KEYS.ACTIVE_CHILD_ID, studentId);
}

export function getActiveChildId(): string | undefined {
    return mmkv.getString(MMKV_KEYS.ACTIVE_CHILD_ID);
}

export function clearActiveChildId(): void {
    mmkv.delete(MMKV_KEYS.ACTIVE_CHILD_ID);
}

// Preferred language (mirrors DB value — used before profile loads)

export function setPreferredLang(lang: string): void {
    mmkv.set(MMKV_KEYS.PREFERRED_LANG, lang);
}

export function getPreferredLang(): string {
    return mmkv.getString(MMKV_KEYS.PREFERRED_LANG) ?? 'ENGLISH';
}

// FCM push token (cached to avoid re-registration on every app open)

export function setCachedPushToken(token: string): void {
    mmkv.set(MMKV_KEYS.PUSH_TOKEN, token);
}

export function getCachedPushToken(): string | undefined {
    return mmkv.getString(MMKV_KEYS.PUSH_TOKEN);
}

// Offline action queue (serialised as JSON string)

export interface OfflineAction {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    createdAt: number;
    retries: number;
}

export function getOfflineQueue(): OfflineAction[] {
    try {
        const raw = mmkv.getString(MMKV_KEYS.OFFLINE_QUEUE);
        return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
    } catch {
        return [];
    }
}

export function addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'createdAt' | 'retries'>): void {
    const queue = getOfflineQueue();
    queue.push({
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        retries: 0,
    });
    mmkv.set(MMKV_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id: string): void {
    const queue = getOfflineQueue().filter((a) => a.id !== id);
    mmkv.set(MMKV_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
    mmkv.delete(MMKV_KEYS.OFFLINE_QUEUE);
}

// Onboarding flag

export function setOnboarded(): void {
    mmkv.set(MMKV_KEYS.ONBOARDED, true);
}

export function isOnboarded(): boolean {
    return mmkv.getBoolean(MMKV_KEYS.ONBOARDED) ?? false;
}

// ─── Full logout cleanup ──────────────────────────────────────────────────────

/**
 * Clear all stored data on logout — Keychain tokens + MMKV state
 * Does NOT clear the offline queue (in case there are unsynced records)
 */
export async function clearAllAuthStorage(): Promise<void> {
    await clearTokens();
    clearActiveChildId();
    mmkv.delete(MMKV_KEYS.PREFERRED_LANG);
    mmkv.delete(MMKV_KEYS.LAST_SYNC);
    // Push token is intentionally kept — no need to re-register on next login
}