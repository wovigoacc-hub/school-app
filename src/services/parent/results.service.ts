// Auto-generated file
import { api } from '../root/api';
import type { PublishedExamResult } from '../../types/exam.types';
import type { SubjectProgressTrend } from '../../types/mark.types';
import type { ApiResponse } from '../../types/api.types';

export const parentResultsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── All published exam results for a child ──────────────────────────────
        getChildResults: builder.query<
            ApiResponse<PublishedExamResult[]>,
            string
        >({
            query: (studentId) => ({
                url: `/v1/mobile/parent/students/${studentId}/results`,
            }),
            providesTags: (result, error, studentId) => [
                { type: 'ChildResults', id: studentId },
            ],
        }),

        // ─── Subject-wise progress trend (chart data) ────────────────────────────
        getChildProgressTrend: builder.query<
            ApiResponse<SubjectProgressTrend[]>,
            string
        >({
            query: (studentId) => ({
                url: `/v1/mobile/parent/students/${studentId}/progress`,
            }),
            providesTags: (result, error, studentId) => [
                { type: 'ProgressTrend', id: studentId },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetChildResultsQuery,
    useGetChildProgressTrendQuery,
} = parentResultsApi;