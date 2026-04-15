// Auto-generated file
import { api } from '../root/api';
import type {
    ParentRequestSummary,
    ParentRequestDetail,
    AddMessageRequest,
    UpdateStatusDto,
} from '../../types/request.types';
import type {
    ApiResponse,
    PaginatedResponse,
    PaginationParams,
} from '../../types/api.types';

type RequestQueryParams = PaginationParams & {
    status?: string;
};

// Re-exporting type for use in screens
export type { UpdateStatusDto };

export const teacherRequestsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Requests assigned to this teacher ───────────────────────────────────
        getTeacherRequests: builder.query<
            PaginatedResponse<ParentRequestSummary>,
            RequestQueryParams
        >({
            query: (params) => ({
                url: '/v1/mobile/teacher/requests',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({
                            type: 'RequestList' as const,
                            id,
                        })),
                        { type: 'RequestList', id: 'TEACHER' },
                    ]
                    : [{ type: 'RequestList', id: 'TEACHER' }],
        }),

        // ─── Request detail with thread ──────────────────────────────────────────
        getTeacherRequestDetail: builder.query<
            ApiResponse<ParentRequestDetail>,
            string
        >({
            query: (id) => ({ url: `/v1/mobile/teacher/requests/${id}` }),
            providesTags: (result, error, id) => [{ type: 'RequestDetail', id }],
        }),

        // ─── Reply on thread ─────────────────────────────────────────────────────
        addTeacherMessage: builder.mutation<
            ApiResponse<any>,
            { requestId: string; body: AddMessageRequest }
        >({
            query: ({ requestId, body }) => ({
                url: `/v1/mobile/teacher/requests/${requestId}/messages`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { requestId }) => [
                { type: 'RequestDetail', id: requestId },
                { type: 'RequestList', id: 'TEACHER' },
            ],
        }),

        // ─── Update status ───────────────────────────────────────────────────────
        updateTeacherRequestStatus: builder.mutation<
            ApiResponse<null>,
            { requestId: string; body: { status: string; note?: string } }
        >({
            query: ({ requestId, body }) => ({
                url: `/v1/mobile/teacher/requests/${requestId}/status`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { requestId }) => [
                { type: 'RequestDetail', id: requestId },
                { type: 'RequestList', id: 'TEACHER' },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetTeacherRequestsQuery,
    useGetTeacherRequestDetailQuery,
    useAddTeacherMessageMutation,
    useUpdateTeacherRequestStatusMutation,
} = teacherRequestsApi;