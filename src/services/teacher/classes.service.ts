import { api } from '../root/api';
import type { TeacherClass } from '../../types/teacher.types';
import type { StudentSummary } from '../../types/student.types';
import type { TeacherSubject } from '../../types/subject.types';
import type { ApiResponse } from '../../types/api.types';

export const teacherClassesApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── My assigned classes (home screen class list + attendance picker) ────
        getMyClasses: builder.query<ApiResponse<TeacherClass[]>, void>({
            query: () => ({ url: '/mobile/teacher/classes' }),
            providesTags: ['TeacherClasses'],
        }),

        // ─── Students in a class (attendance mark sheet roster) ─────────────────
        getClassStudents: builder.query<ApiResponse<StudentSummary[]>, string>({
            query: (classId) => ({
                url: `/mobile/teacher/students/class/${classId}`,
            }),
            providesTags: (result, error, classId) => [
                { type: 'TeacherStudents', id: classId },
            ],
        }),

        // ─── My subjects (mark entry + homework subject picker) ──────────────────
        getMySubjects: builder.query<ApiResponse<TeacherSubject[]>, void>({
            query: () => ({ url: '/mobile/teacher/subjects' }),
            providesTags: ['TeacherSubjects'],
        }),

        // ─── Student academic summary ────────────────────────────────────────────
        getStudentAcademicSummary: builder.query<
            ApiResponse<any>,
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
    useGetMyClassesQuery,
    useGetClassStudentsQuery,
    useGetMySubjectsQuery,
    useGetStudentAcademicSummaryQuery,
} = teacherClassesApi;