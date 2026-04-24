import { api } from '../root/api';
import type {
    MarkSheet,
    SubmitMarksRequest,
    SubmitMarksResponse,
    SubjectProgressTrend,
} from '../../types/mark.types';
import type { ApiResponse } from '../../types/api.types';

export const teacherMarksApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Get mark sheet (pre-populate entry form) ────────────────────────────
        getMarkSheet: builder.query<
            ApiResponse<MarkSheet>,
            { examId: string; subjectId: string; classId: string }
        >({
            query: ({ examId, subjectId, classId }) => ({
                url: '/mobile/teacher/marks/sheet',
                params: { examId, subjectId, classId },
            }),
            providesTags: (result, error, { examId, subjectId, classId }) => [
                {
                    type: 'MarkSheet',
                    id: `${examId}-${subjectId}-${classId}`,
                },
            ],
        }),

        // ─── Submit or save draft marks ──────────────────────────────────────────
        submitMarks: builder.mutation<
            ApiResponse<SubmitMarksResponse>,
            SubmitMarksRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/marks',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { examId, subjectId, classId }) => [
                {
                    type: 'MarkSheet',
                    id: `${examId}-${subjectId}-${classId}`,
                },
                'ExamList',
            ],
        }),

        // ─── Student progress trend ──────────────────────────────────────────────
        getStudentProgressTrend: builder.query<
            ApiResponse<SubjectProgressTrend[]>,
            string
        >({
            query: (studentId) => ({
                url: `/mobile/teacher/marks/student/${studentId}/progress`,
            }),
            providesTags: (result, error, studentId) => [
                { type: 'ProgressTrend', id: studentId },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetMarkSheetQuery,
    useSubmitMarksMutation,
    useGetStudentProgressTrendQuery,
} = teacherMarksApi;