import { api } from '../root/api';
import type { StudentSummary, StudentAcademicSummary } from '../../types/student.types';
import type { ApiResponse } from '../../types/api.types';

export const teacherStudentsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Class roster (for attendance + marks) ───────────────────────────────
        getClassRoster: builder.query<ApiResponse<StudentSummary[]>, string>({
            query: (classId) => ({
                url: `/mobile/teacher/students/class/${classId}`,
            }),
            providesTags: (result, error, classId) => [
                { type: 'TeacherStudents', id: classId },
            ],
        }),

        // ─── Student academic summary ────────────────────────────────────────────
        getStudentSummary: builder.query<
            ApiResponse<StudentAcademicSummary>,
            string
        >({
            query: (studentId) => ({
                url: `/mobile/teacher/students/${studentId}/academic-summary`,
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetClassRosterQuery,
    useGetStudentSummaryQuery,
} = teacherStudentsApi;