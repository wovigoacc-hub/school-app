import React, { useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
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
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { HomeworkDueBadge } from '../../../components/homework/HomeworkDueBadge';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetChildHomeworkFeedQuery,
    useReportHomeworkSubmissionMutation,
} from '../../../services/parent/homework.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDate, formatRelative } from '../../../utils/date.utils';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'HomeworkDetail'
>['route'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeworkDetailScreen() {
    const route = useRoute<RouteProps>();
    const dispatch = useAppDispatch();
    const { homeworkId, studentId } = route.params;

    // Reuse the feed query — the item is already cached
    const {
        data: feedData,
        refetch,
    } = useGetChildHomeworkFeedQuery(
        { studentId, params: { limit: 30 } },
    );

    const homework = feedData?.data?.find((h) => h.id === homeworkId);
    const { refreshing, onRefresh } = useRefresh(refetch);

    const [reportSubmission, { isLoading: isReporting }] =
        useReportHomeworkSubmissionMutation();

    const handleMarkDone = useCallback(async () => {
        try {
            await reportSubmission({ studentId, homeworkId }).unwrap();
            dispatch(showSuccessToast('Marked as submitted!'));
        } catch {
            dispatch(showErrorToast('Could not update. Please try again.'));
        }
    }, [studentId, homeworkId, reportSubmission, dispatch]);

    const confirmMarkDone = useCallback(() => {
        Alert.alert(
            'Mark as Submitted?',
            'This lets the teacher know your child has completed the homework.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, submitted', onPress: handleMarkDone },
            ],
        );
    }, [handleMarkDone]);

    if (!homework) {
        return (
            <ScreenWrapper loading={!feedData} statusBar="parent" />
        );
    }

    const isSubmitted = homework.myStatus === 'SUBMITTED'
        || homework.myStatus === 'LATE'
        || homework.myStatus === 'GRADED';
    const isPending = homework.myStatus === 'PENDING';
    const isGraded = homework.myStatus === 'GRADED';

    return (
        <ScreenWrapper statusBar="parent">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* ── Header card ───────────────────────────────────────────── */}
                <AppCard style={styles.headerCard} noPadding>
                    <View style={styles.cardInner}>
                        {/* Subject pill */}
                        <View style={styles.topRow}>
                            <View style={styles.subjectPill}>
                                <AppText style={styles.subjectDot}>●</AppText>
                                <AppText variant="label" color={Colors.primary}>
                                    {homework.subjectName}
                                </AppText>
                            </View>
                            <HomeworkDueBadge
                                dueDate={homework.dueDate}
                                submitted={isSubmitted && !isGraded}
                                graded={isGraded}
                                grade={
                                    isGraded && homework.marksAwarded != null
                                        ? String(homework.marksAwarded)
                                        : undefined
                                }
                                compact
                            />
                        </View>

                        {/* Title */}
                        <AppText variant="h4" style={styles.title}>
                            {homework.title}
                        </AppText>

                        {/* Due date */}
                        <AppText variant="body2" secondary>
                            Due: {formatDate(homework.dueDate)}
                        </AppText>

                        {/* Graded badge */}
                        {homework.isGraded && (
                            <View style={styles.gradedPill}>
                                <AppText style={styles.gradedText}>📊 Graded assignment</AppText>
                            </View>
                        )}

                        <Divider style={styles.divider} />

                        {/* Instructions */}
                        {homework.instructions ? (
                            <AppText variant="body1" style={styles.instructions}>
                                {homework.instructions}
                            </AppText>
                        ) : (
                            <AppText variant="body2" secondary style={styles.instructions}>
                                No additional instructions provided.
                            </AppText>
                        )}

                        {/* Footer */}
                        <Divider style={styles.divider} />
                        <AppText variant="caption" tertiary>
                            Assigned {formatRelative(homework.createdAt)}
                        </AppText>
                    </View>
                </AppCard>

                {/* ── Submission status card ────────────────────────────────── */}
                <SectionHeader title="Status" compact />
                <AppCard noPadding style={styles.statusCard}>
                    <View style={styles.statusInner}>
                        <View style={styles.statusRow}>
                            <AppText variant="subtitle2">
                                {isGraded ? '★ Graded' :
                                    isSubmitted ? '✓ Submitted' :
                                        isPending ? '○ Not submitted yet' :
                                            '—'}
                            </AppText>
                            {isSubmitted && homework.submittedAt && (
                                <AppText variant="caption" secondary>
                                    {formatRelative(homework.submittedAt)}
                                </AppText>
                            )}
                        </View>

                        {/* Marks awarded */}
                        {isGraded && homework.marksAwarded != null && (
                            <View style={styles.marksRow}>
                                <AppText variant="h3" color={Colors.success}>
                                    {homework.marksAwarded}
                                </AppText>
                                <AppText variant="body2" secondary> marks awarded</AppText>
                            </View>
                        )}

                        {/* Teacher remarks */}
                        {homework.teacherRemarks && (
                            <View style={styles.remarksBox}>
                                <AppText variant="caption" secondary>Teacher's remarks:</AppText>
                                <AppText variant="body2" style={styles.remarksText}>
                                    {homework.teacherRemarks}
                                </AppText>
                            </View>
                        )}
                    </View>
                </AppCard>

                {/* ── Mark done action ─────────────────────────────────────── */}
                {isPending && !homework.isOverdue && (
                    <>
                        <SectionHeader title="Action" compact />
                        <AppCard noPadding style={styles.actionCard}>
                            <View style={styles.actionInner}>
                                <View style={styles.actionText}>
                                    <AppText variant="subtitle2">Has your child completed this?</AppText>
                                    <AppText variant="caption" secondary>
                                        Let the teacher know your child has done this homework.
                                    </AppText>
                                </View>
                                <AppButton
                                    label={isReporting ? 'Saving…' : '✓ Mark submitted'}
                                    variant="primary"
                                    size="sm"
                                    loading={isReporting}
                                    onPress={confirmMarkDone}
                                    style={styles.markDoneBtn}
                                />
                            </View>
                        </AppCard>
                    </>
                )}

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
    headerCard: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    cardInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subjectPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[1],
    },
    subjectDot: {
        fontSize: 8,
        color: Colors.primary,
    },
    title: {
        lineHeight: 26,
    },
    gradedPill: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    gradedText: {
        fontSize: FontSize.sm,
        color: Colors.primary,
        fontWeight: FontWeight.medium,
    },
    divider: {
        marginVertical: Spacing[1],
    },
    instructions: {
        lineHeight: 22,
    },
    statusCard: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    statusInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    marksRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing[1],
    },
    remarksBox: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing[3],
        gap: Spacing[1],
    },
    remarksText: {
        lineHeight: 20,
    },
    actionCard: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    actionInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        gap: Spacing[3],
    },
    actionText: {
        flex: 1,
        gap: 2,
    },
    markDoneBtn: {
        flexShrink: 0,
    },
});