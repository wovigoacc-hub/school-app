// ─── User roles ───────────────────────────────────────────────────────────────

export type UserType = 'teacher' | 'parent';

export type SchoolUserRole =
    | 'ADMIN'
    | 'SUB_ADMIN';

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userType: UserType;
    isFirstLogin: boolean;
    user: AuthUser;
}

// ─── Authenticated user (decoded from JWT + server) ──────────────────────────

export interface AuthUser {
    id: string;
    schoolId: string;
    email: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    userType: UserType;
    isFirstLogin: boolean;
    preferredLang: Language;
}

// ─── JWT payload (decoded client-side) ───────────────────────────────────────

export interface JwtPayload {
    sub: string;       // userId
    schoolId: string;
    email: string;
    type: UserType;
    iat: number;
    exp: number;
}

// ─── Token store (written to Keychain) ───────────────────────────────────────

export interface StoredTokens {
    accessToken: string;
    refreshToken: string;
    userType: UserType;
}

// ─── Change password (first login + voluntary) ───────────────────────────────

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// ─── Refresh token ────────────────────────────────────────────────────────────

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

// ─── Language ─────────────────────────────────────────────────────────────────

export type Language = 'ENGLISH' | 'TAMIL' | 'MALAYALAM';