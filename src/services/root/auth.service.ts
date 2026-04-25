import { api } from './api';
import type {
    LoginRequest,
    LoginResponse,
    ChangePasswordRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserType,
} from '../../types/auth.types';
import type { RegisterDeviceTokenRequest } from '../../types/user.types';
import type { ApiResponse } from '../../types/api.types';

// Maps UserType to the server's mobile sub-path
const rolePath = (userType: UserType) =>
    userType === 'teacher' ? 'teacher' : 'parent';

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Login (teacher) ────────────────────────────────────────────────────
        // Server returns LoginResponse directly (no ApiResponse wrapper)
        teacherLogin: builder.mutation<LoginResponse, LoginRequest>({
            query: (body) => ({
                url: '/auth/mobile/teacher/login',
                method: 'POST',
                body,
            }),
        }),

        // ─── Login (parent) ─────────────────────────────────────────────────────
        // Server returns LoginResponse directly (no ApiResponse wrapper)
        parentLogin: builder.mutation<LoginResponse, LoginRequest>({
            query: (body) => ({
                url: '/auth/mobile/parent/login',
                method: 'POST',
                body,
            }),
        }),

        // ─── Force change password (first login) ─────────────────────────────────
        // Route: /auth/mobile/{teacher|parent}/force-change-password
        // userType is stripped from the body before sending — used only to pick URL
        changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequest & { userType: UserType }>({
            query: ({ userType, ...body }) => ({
                url: `/auth/mobile/${rolePath(userType)}/force-change-password`,
                method: 'PATCH',
                body,
            }),
        }),

        // ─── Refresh token ──────────────────────────────────────────────────────
        refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
            query: (body) => ({
                url: '/auth/refresh',
                method: 'POST',
                body,
            }),
        }),

        // ─── Logout ─────────────────────────────────────────────────────────────
        logout: builder.mutation<ApiResponse<null>, { refreshToken: string }>({
            query: (body) => ({
                url: '/auth/logout',
                method: 'POST',
                body,
            }),
        }),

        // ─── Register FCM device token ───────────────────────────────────────────
        // Route: /auth/mobile/{teacher|parent}/device-token
        registerDeviceToken: builder.mutation<ApiResponse<null>, RegisterDeviceTokenRequest & { userType: UserType }>({
            query: ({ userType, ...body }) => ({
                url: `/auth/mobile/${rolePath(userType)}/device-token`,
                method: 'POST',
                body,
            }),
        }),

        // ─── Remove device token (on logout) ────────────────────────────────────
        // Route: /auth/mobile/{teacher|parent}/device-token
        removeDeviceToken: builder.mutation<ApiResponse<null>, { token: string; userType: UserType }>({
            query: ({ userType, ...body }) => ({
                url: `/auth/mobile/${rolePath(userType)}/device-token`,
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