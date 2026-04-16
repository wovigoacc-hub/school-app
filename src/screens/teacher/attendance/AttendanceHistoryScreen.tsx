import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { AppText } from '../../../components/common/AppText';
import { AppCard } from '../../../components/common/AppCard';
import { AppChip, ChipGroup } from '../../../components/common/AppChip';
import { AttendanceStatusBadge, AttendanceDot } from '../../../components/attendance/AttendanceStatusBadge';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import {
    useGetAttendanceSessionQuery,
} from '../../../services/teacher/attendance.service';
import { useGetClassStudentsQuery } from '../../../services/teacher/classes.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import {
    formatDate,
    formatDateFull,
    getDaysInMonth,
    todayISODate,
    isWeekend,
} from '../../../utils/date.utils';
import { ATTENDANCE_COLOURS, ATTENDANCE_LABELS, countStatuses } from '../../../utils/attendance.utils';
import type { AttendanceStatus } from '../../../types/attendance.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'AttendanceHistory'
>['route'];

// ─── Month selector ───────────────────────────────────────────────────────────

interface MonthSelectorProps {
    year: number;
    month: number;
    onChange: (year: number, month: number) => void;
}

function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
    const now = new Date();

    const goBack = () => {
        if (month === 1) onChange(year - 1, 12);
        else onChange(year, month - 1);
    };

    const goForward = () => {
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
        if (isCurrentMonth) return;
        if (month === 12) onChange(year + 1, 1);
        else onChange(year, month + 1);
    };

    const monthName = new Date(year, month - 1).toLocaleString('en-IN', {
        month: 'long', year: 'numeric',
    });

    const isCurrentMonth =
        year === now.getFullYear() && month === now.getMonth() + 1;

    return (
        <View style={styles.monthSelector}>
            <TouchableOpacity
                onPress={goBack}
                style={styles.monthArrow}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <AppText style={styles.monthArrowText}>‹</AppText>
            </TouchableOpacity>

            <AppText variant="subtitle1">{monthName}</AppText>

            <TouchableOpacity
                onPress={goForward}
                style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
                disabled={isCurrentMonth}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <AppText style={[styles.monthArrowText, isCurrentMonth && { color: Colors.border }]}>
                    ›
                </AppText>
            </TouchableOpacity>
        </View>
    );
}

// ─── Daily record row ─────────────────────────────────────────────────────────

interface DayRowProps {
    date: string;
    classId: string;
    subjectId?: string;
    onPress: (date: string) => void;
}

function DayRow({ date, classId, subjectId, onPress }: DayRowProps) {
    const { data: sessionData } = useGetAttendanceSessionQuery(
        { classId, date, subjectId },
        { skip: isWeekend(date) },
    );

    const session = sessionData?.data;
    const isMarked = !!session?.isSubmitted;
    const isWeekendDay = isWeekend(date);

    if (isWeekendDay) {
        return (
            <View style={[styles.dayRow, styles.dayRowWeekend]}>
                <AppText variant="caption" tertiary style={styles.dayDate}>
                    {formatDate(date)}
                </AppText>
                <AppText variant="caption" tertiary>Weekend</AppText>
            </View>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onPress(date)}
            style={styles.dayRow}
            accessibilityRole="button"
            accessibilityLabel={`Attendance for ${formatDate(date)}`}
        >
            <AppText variant="body2" style={styles.dayDate}>
                {formatDate(date)}
            </AppText>

            {isMarked && session ? (
                <View style={styles.dayStats}>
                    {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY'] as AttendanceStatus[]).map((s) => {
                        const count = s === 'PRESENT' ? session.presentCount :
                            s === 'ABSENT' ? session.absentCount :
                                s === 'LATE' ? session.lateCount :
                                    s === 'LEAVE' ? session.leaveCount :
                                        session.halfDayCount;
                        if (!count) return null;
                        return (
                            <View key={s} style={styles.statChip}>
                                <AttendanceDot status={s} size={6} />
                                <AppText style={[styles.statCount, { color: ATTENDANCE_COLOURS[s] }]}>
                                    {count}
                                </AppText>
                            </View>
                        );
                    })}
                    <AppText variant="caption" tertiary>
                        {session.totalStudents} total
                    </AppText>
                </View>
            ) : (
                <AppText style={styles.notMarked}>Not marked</AppText>
            )}

            <AppText secondary style={styles.dayChevron}>›</AppText>
        </TouchableOpacity>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceHistoryScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NativeStackNavigationProp<TeacherNavigatorParamList>>();

    const { classId, subjectId, className, section } = route.params ?? {};

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);

    const days = useMemo(
        () => getDaysInMonth(year, month).reverse(), // newest first
        [year, month],
    );

    const handleMonthChange = useCallback(
        (y: number, m: number) => { setYear(y); setMonth(m); },
        [],
    );

    const handleDayPress = useCallback(
        (date: string) => {
            navigation.navigate('AttendanceMark', {
                classId,
                date,
                subjectId,
            });
        },
        [navigation, classId, subjectId],
    );

    const renderItem: ListRenderItem<string> = useCallback(
        ({ item }) => (
            <DayRow
                date={item}
                classId={classId}
                subjectId={subjectId}
                onPress={handleDayPress}
            />
        ),
        [classId, subjectId, handleDayPress],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={days}
                keyExtractor={(item) => item}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <AppText variant="h4">
                            {className} {section} — Attendance History
                        </AppText>
                        {subjectId && (
                            <AppText variant="body2" secondary>
                                Subject-wise attendance
                            </AppText>
                        )}
                        <MonthSelector
                            year={year}
                            month={month}
                            onChange={handleMonthChange}
                        />
                    </View>
                }
                ListEmptyComponent={
                    <PresetEmptyState
                        preset="attendance"
                        compact
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.border }} />
                )}
            />
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: Spacing[10],
    },
    header: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[4],
        paddingBottom: Spacing[2],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        gap: Spacing[2],
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing[2],
    },
    monthArrow: { padding: Spacing[2] },
    monthArrowDisabled: { opacity: 0.3 },
    monthArrowText: {
        fontSize: FontSize.xl,
        color: Colors.primary,
        fontWeight: FontWeight.semiBold,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        minHeight: 52,
    },
    dayRowWeekend: {
        backgroundColor: Colors.surfaceSecondary,
        opacity: 0.6,
    },
    dayDate: {
        width: 90,
        flexShrink: 0,
    },
    dayStats: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statCount: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
    },
    notMarked: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
    dayChevron: { fontSize: FontSize.lg, marginLeft: Spacing[2] },
});