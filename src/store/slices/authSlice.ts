import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/rootReducer';
import type { AuthUser, UserType, StoredTokens } from '../../types/auth.types';
import type { LinkedChild } from '../../types/parent.types';
import {
    getTokens,
    clearAllAuthStorage,
    setPreferredLang,
} from '../../utils/storage.utils';
import { extractTokenClaims, isValidToken } from '../../utils/jwt.utils';

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
    // Token state
    accessToken: string | null;
    refreshToken: string | null;

    // User identity (decoded from JWT + profile fetch)
    userId: string | null;
    schoolId: string | null;
    userType: UserType | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    preferredLang: string;

    // Flow control
    isFirstLogin: boolean;
    isAuthenticated: boolean;

    // App startup
    isBootstrapping: boolean;   // true during cold-start token check
    bootstrapError: string | null;
}

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    userId: null,
    schoolId: null,
    userType: null,
    email: null,
    firstName: null,
    lastName: null,
    photoUrl: null,
    preferredLang: 'ENGLISH',
    isFirstLogin: false,
    isAuthenticated: false,
    isBootstrapping: true,
    bootstrapError: null,
};

// ─── Async: bootstrap auth on app cold start ──────────────────────────────────
// Reads tokens from Keychain, validates them, hydrates Redux state.
// Called once in App.tsx on mount.

export const bootstrapAuth = createAsyncThunk(
    'auth/bootstrap',
    async (_, { rejectWithValue }) => {
        try {
            const stored = await getTokens();

            if (!stored || !isValidToken(stored.accessToken)) {
                // No valid tokens — user needs to log in
                return null;
            }

            const claims = extractTokenClaims(stored.accessToken);
            if (!claims) return null;

            return {
                accessToken: stored.accessToken,
                refreshToken: stored.refreshToken,
                userType: stored.userType,
                userId: claims.userId,
                schoolId: claims.schoolId,
                email: claims.email,
            };
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Bootstrap failed');
        }
    },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {

        // Called after successful login — sets everything from the API response
        setAuth: (
            state,
            action: PayloadAction<{
                accessToken: string;
                refreshToken: string;
                userType: UserType;
                user: AuthUser;
            }>,
        ) => {
            const { accessToken, refreshToken, userType, user } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.userType = userType;
            state.userId = user.id;
            state.schoolId = user.schoolId;
            state.email = user.email;
            state.firstName = user.firstName;
            state.lastName = user.lastName;
            state.photoUrl = user.photoUrl ?? null;
            state.preferredLang = user.preferredLang;
            state.isFirstLogin = user.isFirstLogin;
            state.isAuthenticated = true;
            state.bootstrapError = null;
            setPreferredLang(user.preferredLang);
        },

        // Called by baseQueryWithReauth after token refresh
        setTokens: (
            state,
            action: PayloadAction<{
                accessToken: string;
                refreshToken: string;
                userId: string;
                schoolId: string;
                userType: UserType;
            }>,
        ) => {
            const { accessToken, refreshToken, userId, schoolId, userType } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.userId = userId;
            state.schoolId = schoolId;
            state.userType = userType;
        },

        // Called after user successfully changes password on first login
        clearFirstLogin: (state) => {
            state.isFirstLogin = false;
        },

        // Called on profile update (photo, name, language)
        updateProfile: (
            state,
            action: PayloadAction<{
                firstName?: string;
                lastName?: string;
                photoUrl?: string;
                preferredLang?: string;
            }>,
        ) => {
            const { firstName, lastName, photoUrl, preferredLang } = action.payload;
            if (firstName !== undefined) state.firstName = firstName;
            if (lastName !== undefined) state.lastName = lastName;
            if (photoUrl !== undefined) state.photoUrl = photoUrl;
            if (preferredLang !== undefined) {
                state.preferredLang = preferredLang;
                setPreferredLang(preferredLang);
            }
        },

        // Called on logout or when refresh fails — wipes all auth state
        clearAuth: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.userId = null;
            state.schoolId = null;
            state.userType = null;
            state.email = null;
            state.firstName = null;
            state.lastName = null;
            state.photoUrl = null;
            state.isFirstLogin = false;
            state.isAuthenticated = false;
            state.bootstrapError = null;
        },
    },

    // ─── Bootstrap async thunk handlers ─────────────────────────────────────
    extraReducers: (builder) => {
        builder
            .addCase(bootstrapAuth.pending, (state) => {
                state.isBootstrapping = true;
                state.bootstrapError = null;
            })
            .addCase(bootstrapAuth.fulfilled, (state, action) => {
                state.isBootstrapping = false;

                if (!action.payload) {
                    // No valid stored tokens — stay unauthenticated
                    state.isAuthenticated = false;
                    return;
                }

                const { accessToken, refreshToken, userType, userId, schoolId, email } =
                    action.payload;

                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.userType = userType;
                state.userId = userId;
                state.schoolId = schoolId;
                state.email = email;
                state.isAuthenticated = true;
                // firstName/lastName/photoUrl filled in by profile query after navigator mounts
            })
            .addCase(bootstrapAuth.rejected, (state, action) => {
                state.isBootstrapping = false;
                state.isAuthenticated = false;
                state.bootstrapError = action.payload as string;
            });
    },
});

export const {
    setAuth,
    setTokens,
    clearFirstLogin,
    updateProfile,
    clearAuth,
} = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectIsAuthenticated = (s: RootState) => s.auth.isAuthenticated;
export const selectIsBootstrapping = (s: RootState) => s.auth.isBootstrapping;
export const selectIsFirstLogin = (s: RootState) => s.auth.isFirstLogin;
export const selectUserType = (s: RootState) => s.auth.userType;
export const selectUserId = (s: RootState) => s.auth.userId;
export const selectSchoolId = (s: RootState) => s.auth.schoolId;
export const selectAccessToken = (s: RootState) => s.auth.accessToken;
export const selectPreferredLang = (s: RootState) => s.auth.preferredLang;
export const selectIsTeacher = (s: RootState) => s.auth.userType === 'teacher';
export const selectIsParent = (s: RootState) => s.auth.userType === 'parent';
export const selectDisplayName = (s: RootState) =>
    s.auth.firstName && s.auth.lastName
        ? `${s.auth.firstName} ${s.auth.lastName}`
        : s.auth.email ?? '';

export const selectAuthUser = (s: RootState): Partial<AuthUser> => ({
    id: s.auth.userId ?? '',
    schoolId: s.auth.schoolId ?? '',
    email: s.auth.email ?? '',
    firstName: s.auth.firstName ?? '',
    lastName: s.auth.lastName ?? '',
    photoUrl: s.auth.photoUrl ?? undefined,
    userType: s.auth.userType ?? 'parent',
    isFirstLogin: s.auth.isFirstLogin,
    preferredLang: s.auth.preferredLang as any,
});

export default authSlice.reducer;