import { api } from '../root/api';
import type { DiaryApiResponse } from '../../types/diary.types';

export const teacherDiaryApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Get the school's published calendar (filtered for teacher's assigned classes)
        getTeacherDiaryCalendar: builder.query<DiaryApiResponse, { type?: string }>({
            query: (params) => ({
                url: '/mobile/teacher/diary/calendar',
                params,
            }),
            providesTags: ['TeacherDiary'],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetTeacherDiaryCalendarQuery,
} = teacherDiaryApi;
