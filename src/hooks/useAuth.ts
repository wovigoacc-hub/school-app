import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { api } from '../services/root/api';
import {
    clearAuth,
    selectIsAuthenticated,
    selectIsBootstrapping,
    selectIsFirstLogin,
    selectUserType,
    selectUserId,
    selectSchoolId,
    selectDisplayName,
    selectAuthUser,
    selectPreferredLang,
    selectIsTeacher,
    selectIsParent,
    updateProfile,
    clearFirstLogin,
} from '../store/slices/authSlice';
import { clearActiveChild } from '../store/slices/activeChildSlice';
import { clearAllAuthStorage } from '../utils/storage.utils';
import { useLogoutMutation, useRemoveDeviceTokenMutation } from '../services/root/auth.service';
import { getCachedPushToken } from '../utils/storage.utils';

export function useAuth() {
    const dispatch = useAppDispatch();

    // ─── Selectors ──────────────────────────────────────────────────────────
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBootstrapping = useAppSelector(selectIsBootstrapping);
    const isFirstLogin = useAppSelector(selectIsFirstLogin);
    const userType = useAppSelector(selectUserType);
    const userId = useAppSelector(selectUserId);
    const schoolId = useAppSelector(selectSchoolId);
    const displayName = useAppSelector(selectDisplayName);
    const preferredLang = useAppSelector(selectPreferredLang);
    const isTeacher = useAppSelector(selectIsTeacher);
    const isParent = useAppSelector(selectIsParent);
    const user = useAppSelector(selectAuthUser);

    const [logoutMutation] = useLogoutMutation();
    const [removeDeviceToken] = useRemoveDeviceTokenMutation();

    // ─── Logout ──────────────────────────────────────────────────────────────
    // Order matters:
    // 1. Remove FCM token from server (best-effort — don't block on failure)
    // 2. Call logout endpoint to invalidate refresh token on server
    // 3. Clear Keychain tokens
    // 4. Reset all RTK Query cache
    // 5. Clear Redux auth state (triggers RootNavigator → AuthNavigator)
    // 6. Clear active child state

    const logout = useCallback(async () => {
        try {
            // Remove device token so this device stops receiving push notifications
            const pushToken = getCachedPushToken();
            if (pushToken) {
                await removeDeviceToken({ token: pushToken }).unwrap().catch(() => { });
            }

            // Invalidate refresh token on server
            const stored = await import('../utils/storage.utils').then((m) =>
                m.getTokens(),
            );
            if (stored?.refreshToken) {
                await logoutMutation({ refreshToken: stored.refreshToken })
                    .unwrap()
                    .catch(() => { }); // never block logout on server failure
            }
        } finally {
            // Always clear local state even if server calls fail
            await clearAllAuthStorage();
            dispatch(api.util.resetApiState());   // wipe RTK Query cache
            dispatch(clearActiveChild());
            dispatch(clearAuth());                // triggers navigator redirect
        }
    }, [dispatch, logoutMutation, removeDeviceToken]);

    // ─── Mark first login complete ───────────────────────────────────────────
    const markPasswordChanged = useCallback(() => {
        dispatch(clearFirstLogin());
    }, [dispatch]);

    // ─── Update local profile (after profile PATCH succeeds) ────────────────
    const updateLocalProfile = useCallback(
        (changes: { firstName?: string; lastName?: string; photoUrl?: string; preferredLang?: string }) => {
            dispatch(updateProfile(changes));
        },
        [dispatch],
    );

    return {
        // State
        isAuthenticated,
        isBootstrapping,
        isFirstLogin,
        userType,
        userId,
        schoolId,
        displayName,
        preferredLang,
        isTeacher,
        isParent,
        user,

        // Actions
        logout,
        markPasswordChanged,
        updateLocalProfile,
    };
}