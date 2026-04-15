import { api } from '../root/api';
import type { ParentHomeworkItem } from '../../types/homework.types';
import type {
    ApiResponse,
    PaginatedResponse,
    PaginationParams,
} from '../../types/api.types';

type HomeworkFeedParams = PaginationParams & {
    subjectId?: string;
    pendingOnly?: boolean;
};

export const parentHomeworkApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Homework feed for a child (3-month archive) ─────────────────────────
        getChildHomeworkFeed: builder.query<
            PaginatedResponse<ParentHomeworkItem>,
            { studentId: string; params?: HomeworkFeedParams }
        >({
            query: ({ studentId, params }) => ({
                url: `/v1/mobile/parent/students/${studentId}/homework`,
                params,
            }),
            providesTags: (result, error, { studentId }) => [
                { type: 'ChildHomework', id: studentId },
                { type: 'ChildHomework', id: 'LIST' },
            ],
        }),

        // ─── Self-report child has submitted homework ────────────────────────────
        reportHomeworkSubmission: builder.mutation<
            ApiResponse<null>,
            { studentId: string; homeworkId: string }
        >({
            query: ({ studentId, homeworkId }) => ({
                url: `/v1/mobile/parent/students/${studentId}/homework/${homeworkId}/submit`,
                method: 'POST',
                body: {},
            }),
            invalidatesTags: (result, error, { studentId }) => [
                { type: 'ChildHomework', id: studentId },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetChildHomeworkFeedQuery,
    useReportHomeworkSubmissionMutation,
} = parentHomeworkApi;