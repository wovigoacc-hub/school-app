import type { JwtPayload, UserType } from '../types/auth.types';

// ─── Decode JWT ───────────────────────────────────────────────────────────────
// Pure base64 decode — no external library needed.
// We only decode, never verify (verification is server-side).

function base64UrlDecode(str: string): string {
    // Replace URL-safe chars and add padding
    const base64 = str
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');

    // atob is available in React Native's Hermes/JSC environments
    // For older RN versions, use Buffer if atob is unavailable
    if (typeof atob !== 'undefined') {
        return atob(base64);
    }

    // Fallback using Buffer (Node.js / older RN)
    return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Decode a JWT and return its payload.
 * Returns null if the token is malformed.
 * Does NOT verify signature — always trust the server for that.
 */
export function decodeJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = base64UrlDecode(parts[1]);
        return JSON.parse(payload) as JwtPayload;
    } catch {
        return null;
    }
}

// ─── Expiry checks ────────────────────────────────────────────────────────────

/**
 * true if the token has expired (exp < now in seconds)
 */
export function isTokenExpired(token: string): boolean {
    const payload = decodeJwt(token);
    if (!payload?.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
}

/**
 * true if the token will expire within the given number of seconds
 * Default: 60 seconds — refresh before it actually expires
 */
export function isTokenExpiringSoon(
    token: string,
    bufferSec: number = 60,
): boolean {
    const payload = decodeJwt(token);
    if (!payload?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now < bufferSec;
}

/**
 * Seconds until token expiry (negative if already expired)
 */
export function secondsUntilExpiry(token: string): number {
    const payload = decodeJwt(token);
    if (!payload?.exp) return -1;
    return payload.exp - Math.floor(Date.now() / 1000);
}

// ─── Extract fields ───────────────────────────────────────────────────────────

/**
 * Extract the user ID from a JWT
 */
export function getUserIdFromToken(token: string): string | null {
    return decodeJwt(token)?.sub ?? null;
}

/**
 * Extract the school ID from a JWT
 */
export function getSchoolIdFromToken(token: string): string | null {
    return decodeJwt(token)?.schoolId ?? null;
}

/**
 * Extract the user type ("teacher" | "parent") from a JWT
 */
export function getUserTypeFromToken(token: string): UserType | null {
    return decodeJwt(token)?.type ?? null;
}

/**
 * Extract email from a JWT
 */
export function getEmailFromToken(token: string): string | null {
    return decodeJwt(token)?.email ?? null;
}

/**
 * Extract all useful fields in one call — used on app startup
 */
export function extractTokenClaims(token: string): {
    userId: string;
    schoolId: string;
    email: string;
    userType: UserType;
    exp: number;
} | null {
    const payload = decodeJwt(token);
    if (!payload) return null;

    return {
        userId: payload.sub,
        schoolId: payload.schoolId,
        email: payload.email,
        userType: payload.type,
        exp: payload.exp,
    };
}

// ─── Token guards ─────────────────────────────────────────────────────────────

/**
 * Validate a token is structurally valid, not expired, and has required fields
 * Used on app startup before making any API calls
 */
export function isValidToken(token: string | null | undefined): boolean {
    if (!token) return false;

    const payload = decodeJwt(token);
    if (!payload) return false;
    if (!payload.sub || !payload.schoolId || !payload.type) return false;
    if (isTokenExpired(token)) return false;

    return true;
}

/**
 * Check if token belongs to a specific user type
 */
export function isTeacherToken(token: string): boolean {
    return getUserTypeFromToken(token) === 'teacher';
}

export function isParentToken(token: string): boolean {
    return getUserTypeFromToken(token) === 'parent';
}