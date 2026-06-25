import { api } from '../root/api';
import type { DiaryApiResponse } from '../../types/diary.types';

export const parentDiaryApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── Get the school's published calendar (filtered for parent's children's classes)
        getParentDiaryCalendar: builder.query<DiaryApiResponse, { type?: string }>({
            query: (params) => ({
                url: '/mobile/parent/diary/calendar',
                params,
            }),
            providesTags: ['ParentDiary'],
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetParentDiaryCalendarQuery,
} = parentDiaryApi;
