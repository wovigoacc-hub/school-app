import { api } from '../root/api';
import type {
    NotificationRecord,
    UnreadCountResponse,
    MarkDeliveredRequest,
} from '../../types/notification.types';
import type {
    ApiResponse,
    PaginatedResponse,
    PaginationParams,
} from '../../types/api.types';

type NotificationQueryParams = PaginationParams & {
    unreadOnly?: boolean;
};

// ─── Parent notifications ─────────────────────────────────────────────────────

export const parentNotificationsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Notification inbox ──────────────────────────────────────────────────
        getParentNotificationInbox: builder.query<
            PaginatedResponse<NotificationRecord>,
            NotificationQueryParams
        >({
            query: (params) => ({
                url: '/mobile/parent/notifications',
                params,
            }),
            providesTags: ['NotificationInbox'],
        }),

        // ─── Unread count (badge) ────────────────────────────────────────────────
        getParentUnreadNotificationCount: builder.query<
            ApiResponse<UnreadCountResponse>,
            void
        >({
            query: () => ({
                url: '/mobile/parent/notifications/unread-count',
            }),
            providesTags: ['UnreadNotificationCount'],
        }),

        // ─── Mark specific notifications as read ─────────────────────────────────
        markParentNotificationsDelivered: builder.mutation<
            ApiResponse<{ updated: number }>,
            MarkDeliveredRequest
        >({
            query: (body) => ({
                url: '/mobile/parent/notifications/mark-delivered',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['NotificationInbox', 'UnreadNotificationCount'],
        }),

        // ─── Mark all as read ────────────────────────────────────────────────────
        markAllParentNotificationsDelivered: builder.mutation<
            ApiResponse<{ updated: number }>,
            void
        >({
            query: () => ({
                url: '/mobile/parent/notifications/mark-all-delivered',
                method: 'PATCH',
            }),
            invalidatesTags: ['NotificationInbox', 'UnreadNotificationCount'],
        }),
    }),
    overrideExisting: false,
});

// ─── Teacher notifications ────────────────────────────────────────────────────

export const teacherNotificationsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        getTeacherNotificationInbox: builder.query<
            PaginatedResponse<NotificationRecord>,
            NotificationQueryParams
        >({
            query: (params) => ({
                url: '/mobile/teacher/notifications',
                params,
            }),
            providesTags: ['NotificationInbox'],
        }),

        getTeacherUnreadNotificationCount: builder.query<
            ApiResponse<UnreadCountResponse>,
            void
        >({
            query: () => ({
                url: '/mobile/teacher/notifications/unread-count',
            }),
            providesTags: ['UnreadNotificationCount'],
        }),

        markTeacherNotificationsDelivered: builder.mutation<
            ApiResponse<{ updated: number }>,
            MarkDeliveredRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/notifications/mark-delivered',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['NotificationInbox', 'UnreadNotificationCount'],
        }),

        markAllTeacherNotificationsDelivered: builder.mutation<
            ApiResponse<{ updated: number }>,
            void
        >({
            query: () => ({
                url: '/mobile/teacher/notifications/mark-all-delivered',
                method: 'PATCH',
            }),
            invalidatesTags: ['NotificationInbox', 'UnreadNotificationCount'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetParentNotificationInboxQuery,
    useGetParentUnreadNotificationCountQuery,
    useMarkParentNotificationsDeliveredMutation,
    useMarkAllParentNotificationsDeliveredMutation,
} = parentNotificationsApi;

export const {
    useGetTeacherNotificationInboxQuery,
    useGetTeacherUnreadNotificationCountQuery,
    useMarkTeacherNotificationsDeliveredMutation,
    useMarkAllTeacherNotificationsDeliveredMutation,
} = teacherNotificationsApi;