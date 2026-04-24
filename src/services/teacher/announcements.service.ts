import { api } from '../root/api';
import type {
    Announcement,
    CreateAnnouncementRequest,
    UpdateAnnouncementRequest,
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

export const teacherAnnouncementsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Announcement feed (school-wide + own classes) ───────────────────────
        getTeacherAnnouncementFeed: builder.query<
            PaginatedResponse<Announcement>,
            AnnouncementFeedParams
        >({
            query: (params) => ({
                url: '/mobile/teacher/announcements',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({
                            type: 'AnnouncementItem' as const,
                            id,
                        })),
                        { type: 'AnnouncementFeed', id: 'TEACHER' },
                    ]
                    : [{ type: 'AnnouncementFeed', id: 'TEACHER' }],
        }),

        // ─── Unread announcement count (bell badge) ──────────────────────────────
        getTeacherUnreadAnnouncementCount: builder.query<
            ApiResponse<{ unreadCount: number }>,
            void
        >({
            query: () => ({ url: '/mobile/teacher/announcements/unread-count' }),
            providesTags: ['UnreadAnnouncementCount'],
        }),

        // ─── Get single announcement ─────────────────────────────────────────────
        getTeacherAnnouncement: builder.query<ApiResponse<Announcement>, string>({
            query: (id) => ({ url: `/mobile/teacher/announcements/${id}` }),
            providesTags: (result, error, id) => [{ type: 'AnnouncementItem', id }],
        }),

        // ─── Post class-level announcement ───────────────────────────────────────
        createTeacherAnnouncement: builder.mutation<
            ApiResponse<Announcement>,
            CreateAnnouncementRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/announcements',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'AnnouncementFeed', id: 'TEACHER' },
                'UnreadAnnouncementCount',
            ],
        }),

        // ─── Mark announcements as read ──────────────────────────────────────────
        markTeacherAnnouncementsRead: builder.mutation<
            ApiResponse<null>,
            MarkReadRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/announcements/mark-read',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { announcementIds }) => [
                ...announcementIds.map((id) => ({
                    type: 'AnnouncementItem' as const,
                    id,
                })),
                'UnreadAnnouncementCount',
            ],
        }),

        // ─── Update own announcement ─────────────────────────────────────────────
        updateTeacherAnnouncement: builder.mutation<
            ApiResponse<Announcement>,
            { id: string; body: UpdateAnnouncementRequest }
        >({
            query: ({ id, body }) => ({
                url: `/mobile/teacher/announcements/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'AnnouncementItem', id },
                { type: 'AnnouncementFeed', id: 'TEACHER' },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetTeacherAnnouncementFeedQuery,
    useGetTeacherUnreadAnnouncementCountQuery,
    useGetTeacherAnnouncementQuery,
    useCreateTeacherAnnouncementMutation,
    useMarkTeacherAnnouncementsReadMutation,
    useUpdateTeacherAnnouncementMutation,
} = teacherAnnouncementsApi;