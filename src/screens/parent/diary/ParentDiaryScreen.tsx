import React from 'react';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { DiaryCalendarView } from '../../../components/diary/DiaryCalendarView';
import { useGetParentDiaryCalendarQuery } from '../../../services/parent/diary.service';
import { Colors } from '../../../constants/colors';

export function ParentDiaryScreen() {
    const { data, isLoading, refetch } = useGetParentDiaryCalendarQuery({});

    const calendar = data?.data ?? null;
    const events = calendar?.events ?? [];

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <SectionHeader title="School Diary" />
            <DiaryCalendarView
                events={events}
                calendarName={calendar?.name}
                isLoading={isLoading}
                onRefresh={refetch}
                accentColor={Colors.parent}
            />
        </ScreenWrapper>
    );
}
