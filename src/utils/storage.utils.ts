import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredTokens } from '../types/auth.types';

// ─── Keychain service name ─────────────────────────────────────────────────────
// All token entries are namespaced under this service in iOS Keychain
// and Android EncryptedSharedPreferences / Keystore

const KEYCHAIN_SERVICE = 'com.schoolbridge.auth';

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

        if (!result) return null;

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

// ─── AsyncStorage helpers — slow non-sensitive storage ────────────────────────────────

const ASYNC_KEYS = {
    ACTIVE_CHILD_ID: 'active_child_id',
    PREFERRED_LANG: 'preferred_lang',
    OFFLINE_QUEUE: 'offline_queue',
    LAST_SYNC: 'last_sync',
    PUSH_TOKEN: 'push_token',
    ONBOARDED: 'onboarded',
} as const;

// Active child (parent role — which child is selected in switcher)

export async function setActiveChildId(studentId: string): Promise<void> {
    await AsyncStorage.setItem(ASYNC_KEYS.ACTIVE_CHILD_ID, studentId);
}

export async function getActiveChildId(): Promise<string | null> {
    return await AsyncStorage.getItem(ASYNC_KEYS.ACTIVE_CHILD_ID);
}

export async function clearActiveChildId(): Promise<void> {
    await AsyncStorage.removeItem(ASYNC_KEYS.ACTIVE_CHILD_ID);
}

// Preferred language (mirrors DB value — used before profile loads)

export async function setPreferredLang(lang: string): Promise<void> {
    await AsyncStorage.setItem(ASYNC_KEYS.PREFERRED_LANG, lang);
}

export async function getPreferredLang(): Promise<string> {
    const lang = await AsyncStorage.getItem(ASYNC_KEYS.PREFERRED_LANG);
    return lang ?? 'ENGLISH';
}

// FCM push token (cached to avoid re-registration on every app open)

export async function setCachedPushToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ASYNC_KEYS.PUSH_TOKEN, token);
}

export async function getCachedPushToken(): Promise<string | null> {
    return await AsyncStorage.getItem(ASYNC_KEYS.PUSH_TOKEN);
}

// Offline action queue (serialised as JSON string)

export interface OfflineAction {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    createdAt: number;
    retries: number;
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
    try {
        const raw = await AsyncStorage.getItem(ASYNC_KEYS.OFFLINE_QUEUE);
        return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
    } catch {
        return [];
    }
}

export async function addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'createdAt' | 'retries'>): Promise<void> {
    const queue = await getOfflineQueue();
    queue.push({
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        retries: 0,
    });
    await AsyncStorage.setItem(ASYNC_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export async function removeFromOfflineQueue(id: string): Promise<void> {
    const queue = await getOfflineQueue();
    const updatedQueue = queue.filter((a) => a.id !== id);
    await AsyncStorage.setItem(ASYNC_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
}

export async function clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(ASYNC_KEYS.OFFLINE_QUEUE);
}

// Onboarding flag

export async function setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(ASYNC_KEYS.ONBOARDED, 'true');
}

export async function isOnboarded(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ASYNC_KEYS.ONBOARDED);
    return value === 'true';
}

// ─── Full logout cleanup ──────────────────────────────────────────────────────

/**
 * Clear all stored data on logout — Keychain tokens + AsyncStorage state
 * Does NOT clear the offline queue (in case there are unsynced records)
 */
export async function clearAllAuthStorage(): Promise<void> {
    await clearTokens();
    await clearActiveChildId();
    await AsyncStorage.removeItem(ASYNC_KEYS.PREFERRED_LANG);
    await AsyncStorage.removeItem(ASYNC_KEYS.LAST_SYNC);
    // Push token is intentionally kept — no need to re-register on next login
}