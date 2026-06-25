import React from 'react';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { DiaryCalendarView } from '../../../components/diary/DiaryCalendarView';
import { useGetTeacherDiaryCalendarQuery } from '../../../services/teacher/diary.service';
import { Colors } from '../../../constants/colors';

export function TeacherDiaryScreen() {
    const { data, isLoading, refetch } = useGetTeacherDiaryCalendarQuery({});

    const calendar = data?.data ?? null;
    const events = calendar?.events ?? [];

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <SectionHeader title="School Diary" />
            <DiaryCalendarView
                events={events}
                calendarName={calendar?.name}
                isLoading={isLoading}
                onRefresh={refetch}
                accentColor={Colors.teacher}
            />
        </ScreenWrapper>
    );
}
