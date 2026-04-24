import { api } from '../root/api';
import type {
    HomeworkSummary,
    HomeworkDetail,
    CreateHomeworkRequest,
    UpdateHomeworkRequest,
    MarkSubmissionRequest,
    BatchMarkSubmissionsRequest,
    GradeSubmissionRequest,
} from '../../types/homework.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../../types/api.types';

type HomeworkQueryParams = PaginationParams & {
    classId?: string;
    subjectId?: string;
    status?: string;
    overdue?: boolean;
};

export const teacherHomeworkApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── List teacher's homework ─────────────────────────────────────────────
        getTeacherHomework: builder.query<
            PaginatedResponse<HomeworkSummary>,
            HomeworkQueryParams
        >({
            query: (params) => ({
                url: '/mobile/teacher/homework',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({
                            type: 'HomeworkList' as const,
                            id,
                        })),
                        { type: 'HomeworkList', id: 'LIST' },
                    ]
                    : [{ type: 'HomeworkList', id: 'LIST' }],
        }),

        // ─── Get homework detail with submissions ────────────────────────────────
        getHomeworkDetail: builder.query<ApiResponse<HomeworkDetail>, string>({
            query: (id) => ({ url: `/mobile/teacher/homework/${id}` }),
            providesTags: (result, error, id) => [{ type: 'HomeworkDetail', id }],
        }),

        // ─── Create homework ─────────────────────────────────────────────────────
        createHomework: builder.mutation<
            ApiResponse<HomeworkSummary>,
            CreateHomeworkRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/homework',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'HomeworkList', id: 'LIST' }],
        }),

        // ─── Update homework ─────────────────────────────────────────────────────
        updateHomework: builder.mutation<
            ApiResponse<HomeworkSummary>,
            { id: string; body: UpdateHomeworkRequest }
        >({
            query: ({ id, body }) => ({
                url: `/mobile/teacher/homework/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'HomeworkList', id },
                { type: 'HomeworkDetail', id },
            ],
        }),

        // ─── Delete homework ─────────────────────────────────────────────────────
        deleteHomework: builder.mutation<ApiResponse<null>, string>({
            query: (id) => ({
                url: `/mobile/teacher/homework/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'HomeworkList', id },
                { type: 'HomeworkDetail', id },
                { type: 'HomeworkList', id: 'LIST' },
            ],
        }),

        // ─── Mark single submission received ─────────────────────────────────────
        markSubmission: builder.mutation<
            ApiResponse<null>,
            { homeworkId: string; body: MarkSubmissionRequest }
        >({
            query: ({ homeworkId, body }) => ({
                url: `/mobile/teacher/homework/${homeworkId}/submission`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { homeworkId }) => [
                { type: 'HomeworkDetail', id: homeworkId },
            ],
        }),

        // ─── Batch mark multiple submissions ────────────────────────────────────
        batchMarkSubmissions: builder.mutation<
            ApiResponse<{ updated: number }>,
            { homeworkId: string; body: BatchMarkSubmissionsRequest }
        >({
            query: ({ homeworkId, body }) => ({
                url: `/mobile/teacher/homework/${homeworkId}/submissions/batch`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { homeworkId }) => [
                { type: 'HomeworkDetail', id: homeworkId },
                { type: 'HomeworkList', id: homeworkId },
            ],
        }),

        // ─── Grade a submission ──────────────────────────────────────────────────
        gradeSubmission: builder.mutation<
            ApiResponse<any>,
            { homeworkId: string; body: GradeSubmissionRequest }
        >({
            query: ({ homeworkId, body }) => ({
                url: `/mobile/teacher/homework/${homeworkId}/grade`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { homeworkId }) => [
                { type: 'HomeworkDetail', id: homeworkId },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetTeacherHomeworkQuery,
    useGetHomeworkDetailQuery,
    useCreateHomeworkMutation,
    useUpdateHomeworkMutation,
    useDeleteHomeworkMutation,
    useMarkSubmissionMutation,
    useBatchMarkSubmissionsMutation,
    useGradeSubmissionMutation,
} = teacherHomeworkApi;