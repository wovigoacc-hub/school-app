import { api } from './api';
import type {
    LoginRequest,
    LoginResponse,
    ChangePasswordRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
} from '../../types/auth.types';
import type { RegisterDeviceTokenRequest } from '../../types/user.types';
import type { ApiResponse } from '../../types/api.types';

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Login (teacher) ────────────────────────────────────────────────────
        teacherLogin: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
            query: (body) => ({
                url: '/v1/auth/teacher/login',
                method: 'POST',
                body,
            }),
        }),

        // ─── Login (parent) ─────────────────────────────────────────────────────
        parentLogin: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
            query: (body) => ({
                url: '/v1/auth/parent/login',
                method: 'POST',
                body,
            }),
        }),

        // ─── Change password (first login + voluntary) ───────────────────────────
        changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequest>({
            query: (body) => ({
                url: '/v1/auth/change-password',
                method: 'POST',
                body,
            }),
        }),

        // ─── Refresh token ──────────────────────────────────────────────────────
        refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
            query: (body) => ({
                url: '/v1/auth/refresh',
                method: 'POST',
                body,
            }),
        }),

        // ─── Logout ─────────────────────────────────────────────────────────────
        logout: builder.mutation<ApiResponse<null>, { refreshToken: string }>({
            query: (body) => ({
                url: '/v1/auth/logout',
                method: 'POST',
                body,
            }),
        }),

        // ─── Register FCM device token ───────────────────────────────────────────
        registerDeviceToken: builder.mutation<ApiResponse<null>, RegisterDeviceTokenRequest>({
            query: (body) => ({
                url: '/v1/auth/device-token',
                method: 'POST',
                body,
            }),
        }),

        // ─── Remove device token (on logout) ────────────────────────────────────
        removeDeviceToken: builder.mutation<ApiResponse<null>, { token: string }>({
            query: (body) => ({
                url: '/v1/auth/device-token',
                method: 'DELETE',
                body,
            }),
        }),
    }),
});

export const {
    useTeacherLoginMutation,
    useParentLoginMutation,
    useChangePasswordMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
    useRegisterDeviceTokenMutation,
    useRemoveDeviceTokenMutation,
} = authApi;