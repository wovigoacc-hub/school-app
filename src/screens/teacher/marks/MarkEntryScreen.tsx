import React, { useCallback, useMemo } from 'react';
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
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppAvatar } from '../../../components/common/AppAvatar';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import { GradeBadge, MarksDisplay, PassFailBadge, RankBadge }
    from '../../../components/marks/GradeBadge';
import { MarkSheetHeader, MarkColumnHeader }
    from '../../../components/marks/MarkInputRow';
import { useGetMarkSheetQuery } from '../../../services/teacher/marks.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDeadlineLabel, formatDate } from '../../../utils/date.utils';
import { formatPercentage } from '../../../utils/format.utils';
import type { MarkRecord } from '../../../types/mark.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'MarkSheet'
>['route'];
type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Mark record row (read-only — already submitted) ─────────────────────────

interface MarkRecordRowProps {
    record: MarkRecord;
    index: number;
}

function MarkRecordRow({ record, index }: MarkRecordRowProps) {
    const pct = record.percentage;

    return (
        <View style={styles.recordRow}>
            {/* Roll / index */}
            <AppText variant="caption" tertiary style={styles.colRoll}>
                {record.rollNumber ?? index + 1}
            </AppText>

            {/* Avatar + name */}
            <AppAvatar
                firstName={record.studentName.split(' ')[0]}
                lastName={record.studentName.split(' ')[1]}
                size="xs"
                style={styles.recordAvatar}
            />
            <AppText variant="body2" numberOfLines={1} style={styles.colName}>
                {record.studentName}
            </AppText>

            {/* Marks */}
            <View style={styles.colMarks}>
                {record.isAbsent ? (
                    <AppText variant="caption" tertiary style={styles.absentLabel}>AB</AppText>
                ) : (
                    <MarksDisplay
                        obtained={record.marksObtained}
                        max={record.maxMarks}
                        isPassed={record.isPassed}
                        compact
                    />
                )}
            </View>

            {/* Grade + rank */}
            <View style={styles.colGrade}>
                {!record.isAbsent && record.grade && (
                    <GradeBadge grade={record.grade} size="sm" />
                )}
            </View>

            {/* Rank */}
            <View style={styles.colRank}>
                {record.classRank && (
                    <RankBadge rank={record.classRank} />
                )}
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MarkEntryScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();

    const {
        examId, examName, subjectId, subjectName,
        classId, className, section, maxMarks,
    } = route.params;

    const {
        data: sheetData,
        isLoading,
        refetch,
    } = useGetMarkSheetQuery({ examId, subjectId, classId });

    const sheet = sheetData?.data;
    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Stats ───────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        if (!sheet?.marks?.length) return null;
        const marks = sheet.marks;
        const entered = marks.filter((m) => m.marksObtained != null || m.isAbsent);
        const absent = marks.filter((m) => m.isAbsent);
        const passed = marks.filter((m) => m.isPassed === true);
        const failed = marks.filter((m) => m.isPassed === false);
        const values = marks
            .filter((m) => m.marksObtained != null && !m.isAbsent)
            .map((m) => m.marksObtained!);
        const avg = values.length
            ? values.reduce((a, b) => a + b, 0) / values.length
            : null;
        const highest = values.length ? Math.max(...values) : null;
        const lowest = values.length ? Math.min(...values) : null;

        return {
            total: marks.length,
            entered: entered.length,
            absent: absent.length,
            passed: passed.length,
            failed: failed.length,
            avg,
            highest,
            lowest,
        };
    }, [sheet?.marks]);

    const isNotStarted = sheet?.submissionStatus === 'NOT_STARTED';
    const isDraft = sheet?.submissionStatus === 'DRAFT';
    const isSubmitted = sheet?.submissionStatus === 'SUBMITTED' || sheet?.submissionStatus === 'APPROVED';

    const renderItem: ListRenderItem<MarkRecord> = useCallback(
        ({ item, index }) => (
            <MarkRecordRow record={item} index={index} />
        ),
        [],
    );

    if (isLoading) {
        return (
            <ScreenWrapper loading statusBar="teacher" />
        );
    }

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={sheet?.marks ?? []}
                keyExtractor={(item) => item.studentId}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View>
                        {/* Sheet header */}
                        <MarkSheetHeader
                            examName={examName}
                            subjectName={subjectName}
                            maxMarks={maxMarks}
                            className={className}
                            section={section}
                            enteredCount={sheet?.enteredCount ?? 0}
                            totalCount={sheet?.totalStudents ?? 0}
                        />

                        {/* Submission status banner */}
                        {isSubmitted && (
                            <View style={styles.submittedBanner}>
                                <AppText style={styles.submittedText}>
                                    ✓ Marks submitted for approval
                                </AppText>
                            </View>
                        )}
                        {isDraft && (
                            <View style={styles.draftBanner}>
                                <AppText style={styles.draftText}>
                                    ✏️ Draft saved — not yet submitted
                                </AppText>
                            </View>
                        )}

                        {/* Stats card (only after submission) */}
                        {isSubmitted && stats && (
                            <View style={styles.statsSection}>
                                <SectionHeader title="Class Stats" compact />
                                <AppCard noPadding style={styles.statsCard}>
                                    <View style={styles.statsRow}>
                                        <StatCell label="Avg" value={stats.avg != null ? formatPercentage(stats.avg / maxMarks * 100, 0) : '—'} />
                                        <StatCell label="Highest" value={stats.highest != null ? String(stats.highest) : '—'} colour={Colors.success} />
                                        <StatCell label="Lowest" value={stats.lowest != null ? String(stats.lowest) : '—'} colour={Colors.error} />
                                        <StatCell label="Passed" value={String(stats.passed)} colour={Colors.success} />
                                        <StatCell label="Failed" value={String(stats.failed)} colour={Colors.error} />
                                    </View>
                                </AppCard>
                            </View>
                        )}

                        {/* Action button */}
                        <View style={styles.actionRow}>
                            <AppButton
                                label={
                                    isNotStarted ? 'Start Mark Entry' :
                                        isDraft ? 'Continue Editing' :
                                            isSubmitted ? 'View / Edit Marks' :
                                                'Enter Marks'
                                }
                                variant="primary"
                                fullWidth
                                onPress={() =>
                                    navigation.navigate('MarkEntry', {
                                        examId,
                                        examName,
                                        subjectId,
                                        subjectName,
                                        classId,
                                        className,
                                        section,
                                        maxMarks,
                                    })
                                }
                            />
                        </View>

                        {/* Column header for the list below */}
                        {(isDraft || isSubmitted) && !!sheet?.marks?.length && (
                            <View style={styles.colHeaderWrapper}>
                                <View style={styles.colHeader}>
                                    <AppText style={[styles.colHeaderText, styles.colRoll]}>#</AppText>
                                    <AppText style={[styles.colHeaderText, { flex: 1, marginLeft: 20 + Spacing[2] }]}>Student</AppText>
                                    <AppText style={[styles.colHeaderText, styles.colMarksHeader]}>Marks</AppText>
                                    <AppText style={[styles.colHeaderText, styles.colGradeHeader]}>Grade</AppText>
                                    <AppText style={[styles.colHeaderText, styles.colRankHeader]}>Rank</AppText>
                                </View>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    isNotStarted ? (
                        <PresetEmptyState
                            preset="search"
                            icon="✏️"
                            title="No marks entered yet"
                            message="Tap 'Start Mark Entry' above to begin entering marks."
                            compact
                        />
                    ) : null
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
                maxToRenderPerBatch={20}
            />
        </ScreenWrapper>
    );
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
    label, value, colour = Colors.textPrimary,
}: {
    label: string;
    value: string;
    colour?: string;
}) {
    return (
        <View style={styles.statCell}>
            <AppText style={[styles.statValue, { color: colour }]}>{value}</AppText>
            <AppText variant="caption" secondary>{label}</AppText>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ROLL_W = 28;
const MARKS_W = 72;
const GRADE_W = 48;
const RANK_W = 44;

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: Spacing[10],
    },
    submittedBanner: {
        backgroundColor: Colors.successLight,
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    submittedText: {
        fontSize: FontSize.sm,
        color: Colors.success,
        fontWeight: FontWeight.medium,
    },
    draftBanner: {
        backgroundColor: Colors.warningLight,
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    draftText: {
        fontSize: FontSize.sm,
        color: Colors.warning,
        fontWeight: FontWeight.medium,
    },
    statsSection: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[4],
    },
    statsCard: {
        overflow: 'hidden',
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: Spacing[3],
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    actionRow: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[4],
    },
    colHeaderWrapper: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
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
    colHeaderText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.textTertiary,
        textTransform: 'uppercase',
    },
    colMarksHeader: { width: MARKS_W, textAlign: 'center' },
    colGradeHeader: { width: GRADE_W, textAlign: 'center' },
    colRankHeader: { width: RANK_W, textAlign: 'center' },
    // ── Record rows ───────────────────────────────────────────────────────────
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    colRoll: {
        width: ROLL_W,
        textAlign: 'right',
        flexShrink: 0,
        marginRight: Spacing[2],
    },
    recordAvatar: {
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    colName: {
        flex: 1,
    },
    colMarks: {
        width: MARKS_W,
        alignItems: 'center',
        flexShrink: 0,
    },
    colGrade: {
        width: GRADE_W,
        alignItems: 'center',
        flexShrink: 0,
    },
    colRank: {
        width: RANK_W,
        alignItems: 'center',
        flexShrink: 0,
    },
    absentLabel: {
        fontSize: FontSize.xs,
        fontStyle: 'italic',
    },
});