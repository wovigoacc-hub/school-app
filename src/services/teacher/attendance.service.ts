import { api } from '../root/api';
import type {
    AttendanceSession,
    SubmitAttendanceRequest,
    CorrectionRequest,
} from '../../types/attendance.types';
import type { ApiResponse } from '../../types/api.types';

export const teacherAttendanceApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Get session (pre-populate form on screen open) ──────────────────────
        getAttendanceSession: builder.query<
            ApiResponse<AttendanceSession>,
            { classId: string; date: string; subjectId?: string }
        >({
            query: ({ classId, date, subjectId }) => ({
                url: '/mobile/teacher/attendance/session',
                params: { classId, date, ...(subjectId && { subjectId }) },
            }),
            providesTags: (result, error, { classId, date, subjectId }) => [
                {
                    type: 'AttendanceSession',
                    id: `${classId}-${date}-${subjectId ?? 'once'}`,
                },
            ],
        }),

        // ─── Submit attendance session (atomic) ──────────────────────────────────
        submitAttendance: builder.mutation<
            ApiResponse<AttendanceSession>,
            SubmitAttendanceRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/attendance',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { classId, date, subjectId }) => [
                {
                    type: 'AttendanceSession',
                    id: `${classId}-${date}-${subjectId ?? 'once'}`,
                },
                // Invalidate teacher home pending tasks
                'TeacherClasses',
            ],
        }),

        // ─── Submit correction request (post lock-time edit) ────────────────────
        requestAttendanceCorrection: builder.mutation<
            ApiResponse<null>,
            CorrectionRequest
        >({
            query: (body) => ({
                url: '/mobile/teacher/attendance/correction',
                method: 'POST',
                body,
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAttendanceSessionQuery,
    useSubmitAttendanceMutation,
    useRequestAttendanceCorrectionMutation,
} = teacherAttendanceApi;