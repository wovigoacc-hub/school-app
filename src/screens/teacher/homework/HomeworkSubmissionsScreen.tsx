import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { AppText } from '../../../components/common/AppText';
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import {
    SubmissionStatusRow,
    BatchActionBar,
} from '../../../components/homework/SubmissionStatusRow';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetHomeworkDetailQuery,
    useMarkSubmissionMutation,
    useBatchMarkSubmissionsMutation,
} from '../../../services/teacher/homework.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import type { SubmissionStatusRow as SubmissionType, SubmissionStatus } from '../../../types/homework.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'HomeworkSubmissions'
>['route'];

// ─── Filter ───────────────────────────────────────────────────────────────────

type Filter = 'ALL' | 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';

const FILTER_CHIPS: Array<{ value: Filter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'LATE', label: 'Late' },
    { value: 'GRADED', label: 'Graded' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeworkSubmissionsScreen() {
    const route = useRoute<RouteProps>();
    const dispatch = useAppDispatch();
    const { homeworkId, title } = route.params;

    const [filter, setFilter] = useState<Filter>('ALL');

    const {
        data: hwData,
        isLoading,
        refetch,
    } = useGetHomeworkDetailQuery(homeworkId);

    const [markSingle, { isLoading: isMarkingSingle }] = useMarkSubmissionMutation();
    const [batchMark, { isLoading: isBatching }] = useBatchMarkSubmissionsMutation();

    const hw = hwData?.data;
    const allSubmissions = hw?.submissions ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    const isExpired = hw?.status === 'EXPIRED';

    // ─── Filtered submissions ────────────────────────────────────────────────
    const submissions = useMemo(
        () =>
            filter === 'ALL'
                ? allSubmissions
                : allSubmissions.filter((s) => s.status === filter),
        [allSubmissions, filter],
    );

    const submittedCount = allSubmissions.filter((s) => s.status !== 'PENDING').length;
    const pendingCount = allSubmissions.length - submittedCount;

    // ─── Toggle single submission ────────────────────────────────────────────
    const handleToggle = useCallback(
        async (studentId: string, newStatus: 'SUBMITTED' | 'PENDING') => {
            try {
                await markSingle({
                    homeworkId,
                    body: { studentId, status: newStatus },
                }).unwrap();
            } catch {
                dispatch(showErrorToast('Failed to update submission'));
            }
        },
        [homeworkId, markSingle, dispatch],
    );

    // ─── Batch: mark all submitted ───────────────────────────────────────────
    const handleMarkAllDone = useCallback(async () => {
        const pendingIds = allSubmissions
            .filter((s) => s.status === 'PENDING')
            .map((s) => s.studentId);
        if (!pendingIds.length) return;

        try {
            await batchMark({
                homeworkId,
                body: { studentIds: pendingIds, status: 'SUBMITTED' },
            }).unwrap();
            dispatch(showSuccessToast(`${pendingIds.length} marked as submitted`));
        } catch {
            dispatch(showErrorToast('Batch update failed'));
        }
    }, [allSubmissions, homeworkId, batchMark, dispatch]);

    // ─── Batch: reset all to pending ────────────────────────────────────────
    const handleResetAll = useCallback(async () => {
        const submittedIds = allSubmissions
            .filter((s) => s.status === 'SUBMITTED')
            .map((s) => s.studentId);
        if (!submittedIds.length) return;

        try {
            await batchMark({
                homeworkId,
                body: { studentIds: submittedIds, status: 'PENDING' },
            }).unwrap();
            dispatch(showSuccessToast('Submissions reset'));
        } catch {
            dispatch(showErrorToast('Reset failed'));
        }
    }, [allSubmissions, homeworkId, batchMark, dispatch]);

    // ─── Render ──────────────────────────────────────────────────────────────
    const renderItem: ListRenderItem<SubmissionType> = useCallback(
        ({ item }) => (
            <SubmissionStatusRow
                submission={item}
                onToggle={handleToggle}
                showMarks={hw?.isGraded}
                locked={isExpired}
            />
        ),
        [handleToggle, hw?.isGraded, isExpired],
    );

    const ListHeader = (
        <View>
            {/* Stats bar */}
            <View style={styles.statsBar}>
                <AppText variant="body2">
                    {submittedCount}/{allSubmissions.length} submitted
                </AppText>
                {isExpired && (
                    <View style={styles.expiredChip}>
                        <AppText style={styles.expiredText}>Expired — read only</AppText>
                    </View>
                )}
            </View>

            {/* Batch action bar */}
            {!isExpired && (
                <BatchActionBar
                    totalCount={allSubmissions.length}
                    submittedCount={submittedCount}
                    onMarkAllDone={handleMarkAllDone}
                    onMarkAllPending={handleResetAll}
                />
            )}

            {/* Filter chips */}
            <View style={styles.filterBar}>
                {FILTER_CHIPS.map((chip) => {
                    const count = chip.value === 'ALL'
                        ? allSubmissions.length
                        : allSubmissions.filter((s) => s.status === chip.value).length;
                    if (chip.value !== 'ALL' && count === 0) return null;
                    return (
                        <AppChip
                            key={chip.value}
                            label={count > 0 && chip.value !== 'ALL' ? `${chip.label} (${count})` : chip.label}
                            selected={filter === chip.value}
                            onPress={() => setFilter(chip.value)}
                            size="sm"
                        />
                    );
                })}
            </View>

            {/* Column header */}
            <View style={styles.colHeader}>
                <AppText style={styles.colRoll}>#</AppText>
                <AppText style={styles.colName}>Student</AppText>
                <AppText style={styles.colStatus}>Status</AppText>
            </View>
        </View>
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={isLoading ? [] : submissions}
                keyExtractor={(item) => item.studentId}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    isLoading ? (
                        <SkeletonList count={6} />
                    ) : (
                        <PresetEmptyState
                            preset="search"
                            title={filter !== 'ALL' ? 'No students with this status' : 'No submissions yet'}
                            compact
                        />
                    )
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
                maxToRenderPerBatch={20}
            />
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    list: {
        paddingBottom: Spacing[10],
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    expiredChip: {
        backgroundColor: Colors.warningLight,
        borderRadius: 100,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    expiredText: {
        fontSize: FontSize.xs,
        color: Colors.warning,
        fontWeight: FontWeight.medium,
    },
    filterBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
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
    colRoll: { width: 30, fontSize: FontSize.xs, color: Colors.textTertiary },
    colName: { flex: 1, marginLeft: 32 + Spacing[2], fontSize: FontSize.xs, color: Colors.textTertiary },
    colStatus: { fontSize: FontSize.xs, color: Colors.textTertiary, width: 110 },
});