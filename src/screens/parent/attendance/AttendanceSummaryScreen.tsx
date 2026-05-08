import React, { useCallback, useMemo } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackScreenProps,
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppCard } from '../../../components/common/AppCard';
import { AppButton } from '../../../components/common/AppButton';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import {
    AttendanceSummaryCard,
} from '../../../components/attendance/AttendanceSummaryCard';
import {
    AttendanceStatusBadge,
} from '../../../components/attendance/AttendanceStatusBadge';
import {
    countStatuses,
    ATTENDANCE_LABELS,
} from '../../../utils/attendance.utils';
import { formatDate } from '../../../utils/date.utils';
import { useGetChildAttendanceHistoryQuery } from '../../../services/parent/attendance.service';
import { useActiveChild } from '../../../hooks/useActiveChild';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import { FontSize } from '../../../constants/typography';
import type { DailyAttendanceRecord } from '../../../types/attendance.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'AttendanceSummary'
>['route'];
type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Daily record row ─────────────────────────────────────────────────────────

interface RecordRowProps {
    record: DailyAttendanceRecord;
}

function RecordRow({ record }: RecordRowProps) {
    return (
        <View style={styles.recordRow}>
            {/* Date block */}
            <View style={styles.recordDate}>
                <AppText style={styles.dateDay}>
                    {new Date(record.date).getDate()}
                </AppText>
                <View>
                    <AppText style={styles.dateMonth}>
                        {new Date(record.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                    </AppText>
                    <AppText variant="caption" secondary>
                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </AppText>
                </View>
            </View>

            {/* Content block */}
            <View style={styles.recordContent}>
                <AttendanceStatusBadge
                    status={record.status}
                    compact
                />
                {record.note && (
                    <AppText variant="caption" secondary style={styles.recordNote} numberOfLines={2}>
                        {record.note}
                    </AppText>
                )}
            </View>

            {/* Icon */}
            <Icon name="chevron-forward" size={16} color={Colors.textTertiary} />
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceSummaryScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const { activeChildId } = useActiveChild();
    const studentId = route.params?.studentId || activeChildId;

    const {
        data,
        isLoading,
        refetch,
    } = useGetChildAttendanceHistoryQuery({ studentId: studentId ?? '' }, { skip: !studentId });

    const history = data?.data;
    const records = history?.records ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    // Build counts from records for the ring chart
    const counts = useMemo(
        () => countStatuses(records.map((r) => r.status)),
        [records],
    );

    // Sort newest first
    const sortedRecords = useMemo(
        () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
        [records],
    );

    const renderItem: ListRenderItem<DailyAttendanceRecord> = useCallback(
        ({ item }) => <RecordRow record={item} />,
        [],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <FlatList
                data={isLoading ? [] : sortedRecords}
                keyExtractor={(item) => item.date}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        {/* ── Student info ─────────────────────────────────────── */}
                        {history && (
                            <View style={styles.studentHeader}>
                                <View style={styles.headerTitleRow}>
                                    <View style={styles.iconCircle}>
                                        <Icon name="person" size={20} color={Colors.parent} />
                                    </View>
                                    <View>
                                        <AppText variant="h4" style={styles.studentName}>
                                            {history.studentName}
                                        </AppText>
                                        <AppText variant="body2" secondary>
                                            {history.className} {history.section}
                                        </AppText>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── Summary ring card ─────────────────────────────────── */}
                        {!isLoading && history ? (
                            <AttendanceSummaryCard
                                counts={counts}
                                thresholdPct={history.thresholdPct}
                                title="Academic Year"
                                showWarning
                                style={styles.ringCard}
                            />
                        ) : isLoading ? (
                            <View style={styles.ringPlaceholder} />
                        ) : null}

                        {/* ── Calendar link ─────────────────────────────────────── */}
                        <AppButton
                            label="View Detailed Calendar"
                            variant="secondary"
                            leftIcon={<Icon name="calendar-outline" size={18} color={Colors.primary} />}
                            onPress={() =>
                                studentId && navigation.navigate('AttendanceCalendar', { studentId })
                            }
                            style={styles.calBtn}
                            fullWidth
                        />

                        {/* ── Records header ────────────────────────────────────── */}
                        <SectionHeader
                            title="Attendance Logs"
                            count={records.length}
                            style={styles.recordsHeader}
                        />
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <SkeletonList count={6} />
                    ) : (
                        <PresetEmptyState
                            preset="attendance"
                            compact
                        />
                    )
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                    <Divider indent={Layout.screenPaddingH} />
                )}
                removeClippedSubviews
                maxToRenderPerBatch={20}
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
        backgroundColor: Colors.background,
        paddingBottom: Spacing[2],
    },
    studentHeader: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[6],
        paddingBottom: Spacing[4],
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[3],
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.parentLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentName: {
        color: Colors.textPrimary,
        lineHeight: 28,
    },
    ringCard: {
        marginHorizontal: Layout.screenPaddingH,
        marginBottom: Spacing[5],
    },
    ringPlaceholder: {
        height: 160,
        marginHorizontal: Layout.screenPaddingH,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: 16,
        marginBottom: Spacing[5],
    },
    calBtn: {
        marginHorizontal: Layout.screenPaddingH,
        marginBottom: Spacing[4],
    },
    recordsHeader: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[2],
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[4],
        backgroundColor: Colors.surface,
        gap: Spacing[4],
    },
    recordDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[3],
        width: 100,
    },
    dateDay: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textPrimary,
        minWidth: 32,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textTertiary,
    },
    recordContent: {
        flex: 1,
        alignItems: 'flex-start',
        gap: 4,
    },
    recordNote: {
        marginTop: 2,
    },
});