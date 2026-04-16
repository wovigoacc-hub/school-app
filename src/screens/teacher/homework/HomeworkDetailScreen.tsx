import React, { useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard, CardRow } from '../../../components/common/AppCard';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { HomeworkDueBadge } from '../../../components/homework/HomeworkDueBadge';
import { useAppDispatch } from '../../../app/store';
import { showModal, showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetHomeworkDetailQuery,
    useDeleteHomeworkMutation,
    useBatchMarkSubmissionsMutation,
} from '../../../services/teacher/homework.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDate, formatRelative } from '../../../utils/date.utils';
import { formatSubmissionRate } from '../../../utils/format.utils';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'HomeworkDetail'
>['route'];
type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeworkDetailScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();
    const { homeworkId } = route.params;

    const {
        data: hwData,
        isLoading,
        refetch,
    } = useGetHomeworkDetailQuery(homeworkId);

    const [deleteHomework, { isLoading: isDeleting }] = useDeleteHomeworkMutation();
    const [batchMark, { isLoading: isBatching }] = useBatchMarkSubmissionsMutation();

    const hw = hwData?.data;
    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Mark all submitted ──────────────────────────────────────────────────
    const handleMarkAllSubmitted = useCallback(async () => {
        if (!hw) return;
        const pendingIds = hw.submissions
            .filter((s) => s.status === 'PENDING')
            .map((s) => s.studentId);

        if (!pendingIds.length) return;

        try {
            await batchMark({
                homeworkId,
                body: { studentIds: pendingIds, status: 'SUBMITTED' },
            }).unwrap();
            dispatch(showSuccessToast(`${pendingIds.length} submission${pendingIds.length > 1 ? 's' : ''} marked`));
        } catch {
            dispatch(showErrorToast('Failed to update submissions'));
        }
    }, [hw, homeworkId, batchMark, dispatch]);

    // ─── Delete ──────────────────────────────────────────────────────────────
    const handleDelete = useCallback(() => {
        Alert.alert(
            'Delete Homework?',
            `"${hw?.title}" and all submission records will be permanently deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteHomework(homeworkId).unwrap();
                            dispatch(showSuccessToast('Homework deleted'));
                            navigation.goBack();
                        } catch {
                            dispatch(showErrorToast('Failed to delete homework'));
                        }
                    },
                },
            ],
        );
    }, [hw?.title, homeworkId, deleteHomework, dispatch, navigation]);

    if (isLoading || !hw) {
        return <ScreenWrapper loading />;
    }

    const submittedCount = hw.submissions.filter(
        (s) => s.status !== 'PENDING',
    ).length;
    const pendingCount = hw.totalStudents - submittedCount;
    const submissionPct = hw.totalStudents > 0
        ? Math.round((submittedCount / hw.totalStudents) * 100)
        : 0;

    const barColour =
        submissionPct >= 80 ? Colors.success :
            submissionPct >= 50 ? Colors.warning :
                Colors.error;

    return (
        <ScreenWrapper loading={isLoading} statusBar="teacher">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header card */}
                <AppCard style={styles.headerCard}>
                    {/* Subject + type */}
                    <View style={styles.metaRow}>
                        <AppText variant="label" color={Colors.primary}>
                            {hw.subjectName}
                        </AppText>
                        {hw.isGraded && (
                            <View style={styles.gradedPill}>
                                <AppText style={styles.gradedText}>Graded</AppText>
                            </View>
                        )}
                    </View>

                    {/* Title */}
                    <AppText variant="h4" style={styles.title}>
                        {hw.title}
                    </AppText>

                    {/* Class + due */}
                    <View style={styles.metaRow}>
                        <AppText variant="body2" secondary>
                            {hw.className} {hw.section}
                        </AppText>
                        <HomeworkDueBadge dueDate={hw.dueDate} compact />
                    </View>

                    {/* Instructions */}
                    {hw.instructions && (
                        <>
                            <Divider style={styles.divider} />
                            <AppText variant="body2" secondary style={styles.instructions}>
                                {hw.instructions}
                            </AppText>
                        </>
                    )}

                    {/* Meta footer */}
                    <Divider style={styles.divider} />
                    <View style={styles.metaFooter}>
                        <AppText variant="caption" tertiary>
                            Posted {formatRelative(hw.createdAt)} · Due {formatDate(hw.dueDate)}
                        </AppText>
                    </View>
                </AppCard>

                {/* Submission stats */}
                <SectionHeader title="Submissions" count={submittedCount} />
                <AppCard style={styles.statsCard} noPadding>
                    {/* Progress bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <AppText variant="body2">
                                {formatSubmissionRate(submittedCount, hw.totalStudents)}
                            </AppText>
                            <AppText variant="body2" style={{ color: barColour }}>
                                {submissionPct}%
                            </AppText>
                        </View>
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${submissionPct}%`, backgroundColor: barColour },
                                ]}
                            />
                        </View>
                    </View>

                    <Divider />

                    {/* Quick stats row */}
                    <View style={styles.quickStats}>
                        <StatCell label="Submitted" value={submittedCount} colour={Colors.success} />
                        <StatCell label="Pending" value={pendingCount} colour={Colors.warning} />
                        <StatCell label="Total" value={hw.totalStudents} colour={Colors.textSecondary} />
                    </View>
                </AppCard>

                {/* Action buttons */}
                <View style={styles.actions}>
                    {pendingCount > 0 && (
                        <AppButton
                            label={isBatching ? 'Marking…' : `Mark All ${pendingCount} Submitted`}
                            variant="secondary"
                            loading={isBatching}
                            onPress={handleMarkAllSubmitted}
                            fullWidth
                        />
                    )}
                    <AppButton
                        label="View All Submissions"
                        variant="primary"
                        onPress={() =>
                            navigation.navigate('HomeworkSubmissions', {
                                homeworkId,
                                title: hw.title,
                            })
                        }
                        fullWidth
                    />
                    <AppButton
                        label="Edit Homework"
                        variant="ghost"
                        onPress={() => navigation.navigate('HomeworkEdit', { homeworkId })}
                        fullWidth
                    />
                    <AppButton
                        label="Delete"
                        variant="ghost"
                        loading={isDeleting}
                        onPress={handleDelete}
                        fullWidth
                        textStyle={{ color: Colors.error }}
                    />
                </View>

                <Spacer size={Spacing[8]} />
            </ScrollView>
        </ScreenWrapper>
    );
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
    label, value, colour,
}: {
    label: string;
    value: number;
    colour: string;
}) {
    return (
        <View style={styles.statCell}>
            <AppText style={[styles.statValue, { color: colour }]}>{value}</AppText>
            <AppText variant="caption" secondary>{label}</AppText>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: Spacing[10],
    },
    headerCard: {
        marginBottom: Spacing[4],
        gap: Spacing[2],
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gradedPill: {
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    gradedText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.primary,
    },
    title: {
        lineHeight: 26,
    },
    divider: {
        marginVertical: Spacing[2],
    },
    instructions: {
        lineHeight: 20,
    },
    metaFooter: {},
    statsCard: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    progressSection: {
        padding: Spacing[4],
        gap: Spacing[2],
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressTrack: {
        height: 8,
        backgroundColor: Colors.border,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    quickStats: {
        flexDirection: 'row',
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing[3],
        gap: 2,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    actions: {
        gap: Spacing[3],
    },
});