import { api } from '../root/api';
import type {
    TodayAttendance,
    AttendanceHistory,
} from '../../types/attendance.types';
import type { ApiResponse } from '../../types/api.types';

export const parentAttendanceApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Today's attendance status (home screen card) ────────────────────────
        getChildTodayAttendance: builder.query<
            ApiResponse<TodayAttendance>,
            string
        >({
            query: (studentId) => ({
                url: `/mobile/parent/attendance/${studentId}/today`,
            }),
            providesTags: (result, error, studentId) => [
                { type: 'ChildAttendance', id: `today-${studentId}` },
            ],
        }),

        // ─── Attendance history (calendar view) ─────────────────────────────────
        getChildAttendanceHistory: builder.query<
            ApiResponse<AttendanceHistory>,
            { studentId: string; from?: string; to?: string }
        >({
            query: ({ studentId, from, to }) => ({
                url: `/mobile/parent/attendance/${studentId}`,
                params: {
                    ...(from && { from }),
                    ...(to && { to }),
                },
            }),
            providesTags: (result, error, { studentId, from, to }) => [
                {
                    type: 'ChildAttendance',
                    id: `history-${studentId}-${from ?? ''}-${to ?? ''}`,
                },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetChildTodayAttendanceQuery,
    useGetChildAttendanceHistoryQuery,
} = parentAttendanceApi;