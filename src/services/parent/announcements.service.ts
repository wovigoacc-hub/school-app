import { api } from '../root/api';
import type {
    Announcement,
    CalendarEvent,
    MarkReadRequest,
} from '../../types/announcement.types';
import type {
    ApiResponse,
    PaginatedResponse,
    PaginationParams,
} from '../../types/api.types';

type AnnouncementFeedParams = PaginationParams & {
    type?: string;
    unreadOnly?: boolean;
};

export const parentAnnouncementsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Feed (school-wide + children's classes) ─────────────────────────────
        getParentAnnouncementFeed: builder.query<
            PaginatedResponse<Announcement>,
            AnnouncementFeedParams
        >({
            query: (params) => ({
                url: '/mobile/parent/announcements',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({
                            type: 'AnnouncementItem' as const,
                            id,
                        })),
                        { type: 'AnnouncementFeed', id: 'PARENT' },
                    ]
                    : [{ type: 'AnnouncementFeed', id: 'PARENT' }],
        }),

        // ─── Unread count (bell badge) ───────────────────────────────────────────
        getParentUnreadAnnouncementCount: builder.query<
            ApiResponse<{ unreadCount: number }>,
            void
        >({
            query: () => ({ url: '/mobile/parent/announcements/unread-count' }),
            providesTags: ['UnreadAnnouncementCount'],
        }),

        // ─── Single announcement ─────────────────────────────────────────────────
        getParentAnnouncement: builder.query<ApiResponse<Announcement>, string>({
            query: (id) => ({ url: `/mobile/parent/announcements/${id}` }),
            providesTags: (result, error, id) => [{ type: 'AnnouncementItem', id }],
        }),

        // ─── Mark as read ────────────────────────────────────────────────────────
        markParentAnnouncementsRead: builder.mutation<
            ApiResponse<null>,
            MarkReadRequest
        >({
            query: (body) => ({
                url: '/mobile/parent/announcements/mark-read',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { announcementIds }) => [
                ...announcementIds.map((id) => ({
                    type: 'AnnouncementItem' as const,
                    id,
                })),
                'UnreadAnnouncementCount',
                { type: 'AnnouncementFeed', id: 'PARENT' },
            ],
        }),

        // ─── Calendar events (EVENT, HOLIDAY, EXAM_SCHEDULE, PARENT_MEETING) ─────
        getCalendarEvents: builder.query<
            ApiResponse<CalendarEvent[]>,
            { from?: string; to?: string }
        >({
            query: (params) => ({
                url: '/mobile/parent/announcements/calendar/events',
                params,
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetParentAnnouncementFeedQuery,
    useGetParentUnreadAnnouncementCountQuery,
    useGetParentAnnouncementQuery,
    useMarkParentAnnouncementsReadMutation,
    useGetCalendarEventsQuery,
} = parentAnnouncementsApi;