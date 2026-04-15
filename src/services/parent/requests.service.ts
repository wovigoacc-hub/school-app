import { api } from '../root/api';
import type {
    ParentRequestSummary,
    ParentRequestDetail,
    CreateRequestRequest,
    AddMessageRequest,
} from '../../types/request.types';
import type {
    ApiResponse,
    PaginatedResponse,
    PaginationParams,
} from '../../types/api.types';

type RequestQueryParams = PaginationParams & {
    status?: string;
    requestType?: string;
};

export const parentRequestsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── List own requests ───────────────────────────────────────────────────
        getParentRequests: builder.query<
            PaginatedResponse<ParentRequestSummary>,
            RequestQueryParams
        >({
            query: (params) => ({
                url: '/v1/mobile/parent/requests',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({
                            type: 'RequestList' as const,
                            id,
                        })),
                        { type: 'RequestList', id: 'PARENT' },
                    ]
                    : [{ type: 'RequestList', id: 'PARENT' }],
        }),

        // ─── Request detail with thread ──────────────────────────────────────────
        getParentRequestDetail: builder.query<
            ApiResponse<ParentRequestDetail>,
            string
        >({
            query: (id) => ({ url: `/v1/mobile/parent/requests/${id}` }),
            providesTags: (result, error, id) => [{ type: 'RequestDetail', id }],
        }),

        // ─── Raise a new request ─────────────────────────────────────────────────
        createRequest: builder.mutation<
            ApiResponse<ParentRequestSummary>,
            CreateRequestRequest
        >({
            query: (body) => ({
                url: '/v1/mobile/parent/requests',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'RequestList', id: 'PARENT' }],
        }),

        // ─── Reply on thread ─────────────────────────────────────────────────────
        addParentMessage: builder.mutation<
            ApiResponse<any>,
            { requestId: string; body: AddMessageRequest }
        >({
            query: ({ requestId, body }) => ({
                url: `/v1/mobile/parent/requests/${requestId}/messages`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { requestId }) => [
                { type: 'RequestDetail', id: requestId },
            ],
        }),

        // ─── Close own request ───────────────────────────────────────────────────
        closeParentRequest: builder.mutation<ApiResponse<null>, string>({
            query: (requestId) => ({
                url: `/v1/mobile/parent/requests/${requestId}/close`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, requestId) => [
                { type: 'RequestDetail', id: requestId },
                { type: 'RequestList', id: 'PARENT' },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetParentRequestsQuery,
    useGetParentRequestDetailQuery,
    useCreateRequestMutation,
    useAddParentMessageMutation,
    useCloseParentRequestMutation,
} = parentRequestsApi;