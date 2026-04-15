import { api } from '../root/api';
import type { TeacherOpenExam } from '../../types/exam.types';
import type { ApiResponse } from '../../types/api.types';

export const teacherExamsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Open exams (mark entry window active, within teacher's assignments) ─
        getOpenExams: builder.query<ApiResponse<TeacherOpenExam[]>, void>({
            query: () => ({ url: '/v1/mobile/teacher/exams' }),
            providesTags: ['ExamList'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetOpenExamsQuery,
} = teacherExamsApi;