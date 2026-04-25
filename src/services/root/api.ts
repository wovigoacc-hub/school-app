import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import type { RootState } from '../../app/rootReducer';
import { clearAuth, setTokens } from '../../store/slices/authSlice';
import {
    getTokens,
    storeTokens,
    clearAllAuthStorage,
} from '../../utils/storage.utils';
import {
    isTokenExpiringSoon,
    extractTokenClaims,
} from '../../utils/jwt.utils';
import type { RefreshTokenResponse } from '../../types/auth.types';
import { API_BASE_URL } from '../../constants/api.constants';

// ─── Axios instance ───────────────────────────────────────────────────────────

export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ─── Custom base query args ───────────────────────────────────────────────────
// params uses `Record<string, any>` — looser than `Record<string, unknown>` so
// typed query param objects (PaginationParams, HomeworkQueryParams, etc.)
// don't need an explicit index signature to be assignable here.
// axios accepts any object for params and serialises it at runtime.

export type CustomBaseQueryArgs = {
    url: string;
    method?: AxiosRequestConfig['method'];
    body?: unknown;
    params?: Record<string, any>;          // ← was Record<string,unknown>, caused the TS2322 errors
    headers?: Record<string, string>;
};

// ─── Axios base query ─────────────────────────────────────────────────────────

const axiosBaseQuery = (
    { baseUrl }: { baseUrl: string } = { baseUrl: '' },
): BaseQueryFn<CustomBaseQueryArgs, unknown, unknown> =>
    async ({ url, method = 'GET', body, params, headers }, api) => {
        const state = api.getState() as RootState;
        let accessToken = state.auth.accessToken;

        if (!accessToken) {
            const stored = await getTokens();
            accessToken = stored?.accessToken ?? null;
        }

        try {
            const result = await axiosInstance({
                url: `${baseUrl}${url}`,
                method,
                data: body,
                params,
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...headers,
                },
            });
            return { data: result.data };
        } catch (err) {
            const axiosErr = err as AxiosError;
            return {
                error: {
                    status: axiosErr.response?.status,
                    data: axiosErr.response?.data ?? axiosErr.message,
                },
            };
        }
    };

// ─── Base query with automatic 401 → refresh → retry ────────────────────────

const baseQueryWithReauth: BaseQueryFn<
    CustomBaseQueryArgs,
    unknown,
    unknown
> = async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    let accessToken = state.auth.accessToken;

    // Proactively refresh if token expires within 60 s
    if (accessToken && isTokenExpiringSoon(accessToken, 60)) {
        await refreshAccessToken(api);
    }

    let result = await axiosBaseQuery({ baseUrl: API_BASE_URL })(
        args, api, extraOptions,
    );

    // On 401 → refresh once and retry
    if ((result.error as any)?.status === 401) {
        const refreshed = await refreshAccessToken(api);
        if (refreshed) {
            result = await axiosBaseQuery({ baseUrl: API_BASE_URL })(
                args, api, extraOptions,
            );
        } else {
            await clearAllAuthStorage();
            api.dispatch(clearAuth());
        }
    }

    return result;
};

// ─── Token refresh helper ─────────────────────────────────────────────────────

async function refreshAccessToken(api: any): Promise<boolean> {
    try {
        const stored = await getTokens();
        if (!stored?.refreshToken) return false;

        const response = await axiosInstance.post<RefreshTokenResponse>(
            '/auth/refresh',
            { refreshToken: stored.refreshToken },
        );

        const { accessToken, refreshToken } = response.data;
        await storeTokens({ ...stored, accessToken, refreshToken });

        const claims = extractTokenClaims(accessToken);
        if (claims) {
            api.dispatch(
                setTokens({
                    accessToken,
                    refreshToken,
                    userId: claims.userId,
                    schoolId: claims.schoolId,
                    userType: claims.userType,
                }),
            );
        }
        return true;
    } catch {
        return false;
    }
}

// ─── Root API ─────────────────────────────────────────────────────────────────
// Single createApi instance — all service files inject endpoints into this.
// One RTK Query cache, one invalidation graph, one Redux slice.

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'Auth',
        'TeacherProfile',
        'TeacherClasses',
        'TeacherSubjects',
        'TeacherStudents',
        'AttendanceSession',
        'AttendanceHistory',
        'HomeworkList',
        'HomeworkDetail',
        'MarkSheet',
        'ExamList',
        'ProgressTrend',
        'AnnouncementFeed',
        'AnnouncementItem',
        'UnreadAnnouncementCount',
        'RequestList',
        'RequestDetail',
        'ParentProfile',
        'ChildList',
        'ChildAttendance',
        'ChildHomework',
        'ChildResults',
        'NotificationInbox',
        'UnreadNotificationCount',
    ],
    endpoints: () => ({}),
});