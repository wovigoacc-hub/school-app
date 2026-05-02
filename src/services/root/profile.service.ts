import { api } from './api';
import type { Teacher, UpdateTeacherSelfRequest } from '../../types/teacher.types';
import type { Parent, UpdateParentSelfRequest } from '../../types/parent.types';
import type { ApiResponse } from '../../types/api.types';

export const profileApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Teacher Profile ──────────────────────────────────────────────────
        getTeacherProfile: builder.query<ApiResponse<Teacher>, void>({
            query: () => ({ url: '/mobile/teacher/profile' }),
            providesTags: ['TeacherProfile'],
        }),

        updateTeacherProfile: builder.mutation<ApiResponse<Teacher>, UpdateTeacherSelfRequest>({
            query: (body) => ({
                url: '/mobile/teacher/profile',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['TeacherProfile'],
        }),

        // ─── Parent Profile ───────────────────────────────────────────────────
        getParentProfile: builder.query<ApiResponse<Parent>, void>({
            query: () => ({ url: '/mobile/parent/profile' }),
            providesTags: ['ParentProfile'],
        }),

        updateParentProfile: builder.mutation<ApiResponse<Parent>, UpdateParentSelfRequest>({
            query: (body) => ({
                url: '/mobile/parent/profile',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['ParentProfile'],
        }),

    }),
});

export const {
    useGetTeacherProfileQuery,
    useLazyGetTeacherProfileQuery,
    useUpdateTeacherProfileMutation,
    useGetParentProfileQuery,
    useLazyGetParentProfileQuery,
    useUpdateParentProfileMutation,
} = profileApi;
