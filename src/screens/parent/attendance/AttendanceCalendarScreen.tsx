import React, { useState, useCallback, useMemo } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppCard } from '../../../components/common/AppCard';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { AttendanceStatusBadge, AttendanceDot } from '../../../components/attendance/AttendanceStatusBadge';
import {
    ATTENDANCE_COLOURS,
    ATTENDANCE_LABELS,
    ATTENDANCE_BG_COLOURS,
    attendancePctColour,
} from '../../../utils/attendance.utils';
import { formatAttendancePct } from '../../../utils/format.utils';
import {
    formatDate,
    getDaysInMonth,
    isWeekend,
    isToday,
    todayISODate,
    getLocalizedMonthName,
} from '../../../utils/date.utils';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { useGetChildAttendanceHistoryQuery } from '../../../services/parent/attendance.service';
import { useAppSelector } from '../../../app/store';
import { selectPreferredLang } from '../../../store/slices/authSlice';
import type { AttendanceStatus, DailyAttendanceRecord } from '../../../types/attendance.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'AttendanceCalendar'
>['route'];

// ─── Calendar constants ───────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Mini calendar ────────────────────────────────────────────────────────────

interface MiniCalendarProps {
    year: number;
    month: number;
    records: DailyAttendanceRecord[];
    onDayPress: (date: string) => void;
}

function MiniCalendar({ year, month, records, onDayPress }: MiniCalendarProps) {
    const lang = useAppSelector(selectPreferredLang);

    // Build record map: date → status
    const recordMap = useMemo(() => {
        const map: Record<string, AttendanceStatus> = {};
        records.forEach((r) => { map[r.date] = r.status; });
        return map;
    }, [records]);

    // Build calendar grid
    const { weeks } = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
        const daysCount = new Date(year, month, 0).getDate();
        const cells: Array<string | null> = [
            ...Array(firstDay).fill(null),
            ...getDaysInMonth(year, month),
        ];
        // Pad to full weeks
        while (cells.length % 7 !== 0) cells.push(null);

        const weeks: Array<Array<string | null>> = [];
        for (let i = 0; i < cells.length; i += 7) {
            weeks.push(cells.slice(i, i + 7));
        }
        return { weeks };
    }, [year, month]);

    return (
        <View style={calStyles.calendar}>
            {/* Weekday header */}
            <View style={calStyles.weekRow}>
                {WEEKDAY_LABELS.map((d) => (
                    <AppText key={d} style={calStyles.weekLabel}>{d}</AppText>
                ))}
            </View>

            {/* Day grid */}
            {weeks.map((week, wi) => (
                <View key={wi} style={calStyles.weekRow}>
                    {week.map((date, di) => {
                        if (!date) {
                            return <View key={di} style={calStyles.cell} />;
                        }
                        const status = recordMap[date];
                        const isWknd = isWeekend(date);
                        const isTdy = isToday(date);
                        const dayNum = new Date(date).getDate();

                        return (
                            <TouchableOpacity
                                key={date}
                                onPress={() => status && onDayPress(date)}
                                style={calStyles.cell}
                                disabled={!status && !isTdy}
                                accessibilityRole="button"
                                accessibilityLabel={`${date}: ${status ? ATTENDANCE_LABELS[status] : 'No record'}`}
                            >
                                <View
                                    style={[
                                        calStyles.dayCircle,
                                        isTdy && calStyles.dayCircleToday,
                                        status && { backgroundColor: ATTENDANCE_BG_COLOURS[status] },
                                    ]}
                                >
                                    <AppText
                                        style={[
                                            calStyles.dayNum,
                                            isWknd && calStyles.dayNumWeekend,
                                            isTdy && calStyles.dayNumToday,
                                            status && { color: ATTENDANCE_COLOURS[status] },
                                        ]}
                                    >
                                        {dayNum}
                                    </AppText>
                                </View>
                                {status && (
                                    <AttendanceDot status={status} size={5} style={calStyles.dot} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const calStyles = StyleSheet.create({
    calendar: { gap: 4 },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    weekLabel: {
        width: 36,
        textAlign: 'center',
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        fontWeight: FontWeight.medium,
    },
    cell: {
        width: 36,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    dayCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCircleToday: {
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    dayNum: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    dayNumWeekend: { color: Colors.textTertiary },
    dayNumToday: { color: Colors.primary, fontWeight: FontWeight.bold },
    dot: { marginTop: 1 },
});

// ─── Month navigation ─────────────────────────────────────────────────────────

interface MonthNavProps {
    year: number;
    month: number;
    onChange: (y: number, m: number) => void;
    lang: string;
}

function MonthNav({ year, month, onChange, lang }: MonthNavProps) {
    const now = new Date();
    const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

    const goBack = () =>
        month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1);

    const goForward = () => {
        if (isCurrent) return;
        month === 12 ? onChange(year + 1, 1) : onChange(year, month + 1);
    };

    return (
        <View style={navStyles.row}>
            <TouchableOpacity
                onPress={goBack}
                style={navStyles.btn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Icon name="chevron-back" size={24} color={Colors.primary} />
            </TouchableOpacity>

            <AppText variant="subtitle1" style={navStyles.monthText}>
                {getLocalizedMonthName(month, lang)} {year}
            </AppText>

            <TouchableOpacity
                onPress={goForward}
                style={[navStyles.btn, isCurrent && navStyles.btnDisabled]}
                disabled={isCurrent}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Icon
                    name="chevron-forward"
                    size={24}
                    color={isCurrent ? Colors.border : Colors.primary}
                />
            </TouchableOpacity>
        </View>
    );
}

const navStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    btn: {
        padding: Spacing[1],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.3 },
    monthText: {
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceCalendarScreen() {
    const route = useRoute<RouteProps>();
    const { studentId } = route.params;
    const lang = useAppSelector(selectPreferredLang);

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    // Fetch full history (server returns all records for academic year)
    const {
        data,
        isLoading,
        refetch,
    } = useGetChildAttendanceHistoryQuery({ studentId }, { skip: !studentId });

    const history = data?.data;
    const allRecords = history?.records ?? [];

    const { refreshing, onRefresh } = useRefresh(refetch);

    // Filter records to the current month
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthRecords = useMemo(
        () => allRecords.filter((r) => r.date.startsWith(monthPrefix)),
        [allRecords, monthPrefix],
    );

    // Month-level stats
    const monthStats = useMemo(() => {
        const counts: Partial<Record<AttendanceStatus, number>> = {};
        monthRecords.forEach((r) => {
            counts[r.status] = (counts[r.status] ?? 0) + 1;
        });
        const total = monthRecords.length;
        const present = (counts.PRESENT ?? 0) + (counts.LATE ?? 0) + (counts.HALF_DAY ?? 0) * 0.5;
        const pct = total > 0 ? (present / total) * 100 : null;
        return { counts, total, pct };
    }, [monthRecords]);

    // Full-year stats from server
    const yearPct = history?.attendancePct ?? null;
    const thresholdPct = history?.thresholdPct ?? 75;

    const handleDayPress = useCallback(
        (date: string) => {
            // Could navigate to a detail modal — for now handled inline
        },
        [],
    );

    return (
        <ScreenWrapper noKeyboard statusBar="parent">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* ── Overall stats card ────────────────────────────────────── */}
                {!isLoading && history && (
                    <AppCard style={styles.overallCard}>
                        <AppText variant="subtitle1">
                            {history.studentName}
                        </AppText>
                        <AppText variant="body2" secondary>
                            {history.className} {history.section}
                        </AppText>

                        <View style={styles.overallStats}>
                            {/* Big percentage */}
                            <View style={styles.pctBlock}>
                                <AppText
                                    style={[
                                        styles.pctText,
                                        {
                                            color: yearPct != null
                                                ? attendancePctColour(yearPct, thresholdPct)
                                                : Colors.textTertiary
                                        },
                                    ]}
                                >
                                    {yearPct != null ? formatAttendancePct(yearPct) : '—'}
                                </AppText>
                                <AppText variant="caption" secondary>Overall</AppText>
                            </View>

                            <Divider style={styles.statDivider} />

                            {/* Breakdown counts */}
                            <View style={styles.countGrid}>
                                {(
                                    [
                                        ['PRESENT', history.presentCount],
                                        ['ABSENT', history.absentCount],
                                        ['LATE', history.lateCount],
                                        ['LEAVE', history.leaveCount],
                                        ['HALF_DAY', history.halfDayCount],
                                    ] as [AttendanceStatus, number][]
                                )
                                    .filter(([, c]) => c > 0)
                                    .map(([status, count]) => (
                                        <View key={status} style={styles.countCell}>
                                            <AttendanceDot status={status} size={8} />
                                            <AppText style={[styles.countNum, { color: ATTENDANCE_COLOURS[status] }]}>
                                                {count}
                                            </AppText>
                                            <AppText variant="caption" secondary style={styles.countLabel}>
                                                {ATTENDANCE_LABELS[status]}
                                            </AppText>
                                        </View>
                                    ))}
                            </View>
                        </View>

                        {/* Threshold warning */}
                        {yearPct != null && yearPct < thresholdPct && (
                            <View style={styles.thresholdWarn}>
                                <Icon name="warning" size={16} color={Colors.warning} style={{ marginRight: 8 }} />
                                <AppText style={styles.thresholdText}>
                                    Below {thresholdPct}% minimum attendance
                                </AppText>
                            </View>
                        )}
                    </AppCard>
                )}

                {/* ── Calendar card ─────────────────────────────────────────── */}
                <AppCard style={styles.calCard}>
                    <MonthNav
                        year={year}
                        month={month}
                        onChange={(y, m) => { setYear(y); setMonth(m); }}
                        lang={lang}
                    />

                    <Divider style={styles.divider} />

                    {isLoading ? (
                        <View style={styles.calLoading}>
                            <AppText variant="body2" secondary center>Loading…</AppText>
                        </View>
                    ) : (
                        <MiniCalendar
                            year={year}
                            month={month}
                            records={monthRecords}
                            onDayPress={handleDayPress}
                        />
                    )}

                    {/* Month legend */}
                    <Divider style={styles.divider} />
                    <View style={styles.legend}>
                        {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as AttendanceStatus[]).map((s) => (
                            <View key={s} style={styles.legendItem}>
                                <AttendanceDot status={s} size={8} />
                                <AppText variant="caption" secondary>
                                    {ATTENDANCE_LABELS[s]}
                                </AppText>
                            </View>
                        ))}
                    </View>

                    {/* Month summary */}
                    {monthRecords.length > 0 && (
                        <View style={styles.monthSummary}>
                            <AppText variant="caption" secondary center>
                                {getLocalizedMonthName(month, lang)}: {monthStats.total} school day{monthStats.total !== 1 ? 's' : ''}
                                {monthStats.pct != null
                                    ? ` · ${formatAttendancePct(monthStats.pct)} present`
                                    : ''}
                            </AppText>
                        </View>
                    )}
                </AppCard>

                <Spacer size={Spacing[8]} />
            </ScrollView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: Spacing[10],
    },
    overallCard: {
        marginBottom: Spacing[4],
        gap: Spacing[3],
    },
    overallStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[4],
        marginTop: Spacing[2],
    },
    pctBlock: {
        alignItems: 'center',
        minWidth: 72,
    },
    pctText: {
        fontSize: 38,
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
        lineHeight: 44,
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        height: '80%',
        alignSelf: 'center',
        backgroundColor: Colors.border,
    },
    countGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[3],
    },
    countCell: {
        alignItems: 'center',
        gap: 2,
        minWidth: 44,
    },
    countNum: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    countLabel: {
        textAlign: 'center',
    },
    thresholdWarn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warningLight,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[2],
        marginTop: Spacing[1],
        borderWidth: 1,
        borderColor: Colors.warningBorder,
    },
    thresholdText: {
        fontSize: FontSize.sm,
        color: Colors.warning,
        fontWeight: FontWeight.medium,
    },
    calCard: {
        gap: Spacing[4],
    },
    calLoading: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: { marginVertical: Spacing[1] },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[1],
    },
    monthSummary: {
        marginTop: Spacing[1],
    },
});