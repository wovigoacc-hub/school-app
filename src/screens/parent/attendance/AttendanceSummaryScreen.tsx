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
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import { FontSize } from '../../../constants/typography';
import type { DailyAttendanceRecord } from '../../../types/attendance.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

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
            {/* Date */}
            <View style={styles.recordDate}>
                <AppText variant="body2">
                    {formatDate(record.date)}
                </AppText>
                <AppText variant="caption" secondary>
                    {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                </AppText>
            </View>

            {/* Status badge */}
            <AttendanceStatusBadge
                status={record.status}
                compact
            />

            {/* Note */}
            {record.note && (
                <AppText variant="caption" secondary style={styles.recordNote} numberOfLines={1}>
                    {record.note}
                </AppText>
            )}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceSummaryScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const { studentId } = route.params;

    const {
        data,
        isLoading,
        refetch,
    } = useGetChildAttendanceHistoryQuery({ studentId });

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
                    <View>
                        {/* ── Student info ─────────────────────────────────────── */}
                        {history && (
                            <View style={styles.studentHeader}>
                                <AppText variant="h4">
                                    {history.studentName}
                                </AppText>
                                <AppText variant="body2" secondary>
                                    {history.className} {history.section}
                                </AppText>
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
                            label="View Calendar"
                            variant="secondary"
                            onPress={() =>
                                navigation.navigate('AttendanceCalendar', { studentId })
                            }
                            style={styles.calBtn}
                            fullWidth
                        />

                        {/* ── Records header ────────────────────────────────────── */}
                        <SectionHeader
                            title="All Records"
                            count={records.length}
                            style={styles.recordsHeader}
                        />

                        {/* Column labels */}
                        <View style={styles.colHeader}>
                            <AppText style={styles.colDate}>Date</AppText>
                            <AppText style={styles.colStatus}>Status</AppText>
                            <AppText style={styles.colNote}>Note</AppText>
                        </View>
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
    studentHeader: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[4],
        paddingBottom: Spacing[3],
        gap: Spacing[1],
    },
    ringCard: {
        marginHorizontal: Layout.screenPaddingH,
        marginBottom: Spacing[3],
    },
    ringPlaceholder: {
        height: 160,
        marginHorizontal: Layout.screenPaddingH,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: 12,
        marginBottom: Spacing[3],
    },
    calBtn: {
        marginHorizontal: Layout.screenPaddingH,
        marginBottom: Spacing[2],
    },
    recordsHeader: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[2],
    },
    colHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surfaceSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    colDate: { fontSize: FontSize.xs, color: Colors.textTertiary, width: 100 },
    colStatus: { fontSize: FontSize.xs, color: Colors.textTertiary, flex: 1 },
    colNote: { fontSize: FontSize.xs, color: Colors.textTertiary, flex: 1 },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        gap: Spacing[3],
    },
    recordDate: {
        width: 100,
        gap: 2,
    },
    recordNote: {
        flex: 1,
    },
});