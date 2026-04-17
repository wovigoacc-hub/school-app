import React, { useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
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
import {
    GradeBadge,
    MarksDisplay,
    PassFailBadge,
    RankBadge,
} from '../../../components/marks/GradeBadge';
import { useGetChildResultsQuery } from '../../../services/parent/results.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDate, formatRelative } from '../../../utils/date.utils';
import { formatPercentage, gradeColour } from '../../../utils/format.utils';
import type { ExamSubjectResult } from '../../../types/exam.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'ExamResult'
>['route'];
type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Exam type labels ─────────────────────────────────────────────────────────

const EXAM_TYPE_LABELS: Record<string, string> = {
    UNIT_TEST: 'Unit Test',
    MIDTERM: 'Midterm',
    FINAL: 'Final',
    QUARTERLY: 'Quarterly',
    HALF_YEARLY: 'Half Yearly',
    ANNUAL: 'Annual',
    INTERNAL: 'Internal',
};

// ─── Subject result row ───────────────────────────────────────────────────────

function SubjectResultRow({ result }: { result: ExamSubjectResult }) {
    const colour = result.isAbsent || result.marksObtained == null
        ? Colors.textTertiary
        : result.isPassed === false
            ? Colors.error
            : Colors.textPrimary;

    return (
        <View style={rowStyles.row}>
            {/* Subject name */}
            <AppText
                variant="body2"
                numberOfLines={1}
                style={[rowStyles.subjectName, result.isAbsent && rowStyles.nameAbsent]}
            >
                {result.subjectName}
            </AppText>

            {/* Marks */}
            <View style={rowStyles.marksCol}>
                <MarksDisplay
                    obtained={result.marksObtained}
                    max={result.maxMarks}
                    isPassed={result.isPassed}
                    isAbsent={result.isAbsent}
                    compact
                />
            </View>

            {/* Grade */}
            <View style={rowStyles.gradeCol}>
                {!result.isAbsent && result.grade && (
                    <GradeBadge grade={result.grade} size="sm" />
                )}
            </View>

            {/* Pass/fail */}
            <View style={rowStyles.pfCol}>
                <PassFailBadge
                    isPassed={result.isPassed}
                    isAbsent={result.isAbsent}
                />
            </View>
        </View>
    );
}

const rowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        minHeight: 52,
    },
    subjectName: { flex: 1, marginRight: Spacing[3] },
    nameAbsent: { color: Colors.textTertiary },
    marksCol: { width: 72, alignItems: 'center' },
    gradeCol: { width: 40, alignItems: 'center' },
    pfCol: { width: 44, alignItems: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ExamResultScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const { examId, studentId, examName } = route.params;

    const {
        data,
        isLoading,
        refetch,
    } = useGetChildResultsQuery(studentId);

    const result = data?.data?.find((r) => r.examId === examId);
    const { refreshing, onRefresh } = useRefresh(refetch);

    if (isLoading || !result) {
        return <ScreenWrapper loading={isLoading} statusBar="parent" />;
    }

    const overallColour = result.percentage != null
        ? gradeColour(
            result.percentage >= 90 ? 'A+' :
                result.percentage >= 80 ? 'A' :
                    result.percentage >= 70 ? 'B+' :
                        result.percentage >= 60 ? 'B' :
                            result.percentage >= 50 ? 'C' :
                                result.percentage >= 35 ? 'D' : 'F',
        )
        : Colors.textTertiary;

    const passedCount = result.results.filter((r) => r.isPassed === true).length;
    const failedCount = result.results.filter((r) => r.isPassed === false).length;
    const absentCount = result.results.filter((r) => r.isAbsent).length;

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* ── Overall summary card ──────────────────────────────────── */}
                <AppCard style={styles.summaryCard}>
                    {/* Exam type + name */}
                    <View style={styles.examTypePill}>
                        <AppText style={styles.examTypeText}>
                            {EXAM_TYPE_LABELS[result.examType] ?? result.examType}
                        </AppText>
                    </View>
                    <AppText variant="h4" style={styles.examTitle}>
                        {result.examName}
                    </AppText>
                    <AppText variant="caption" secondary>
                        Published {formatRelative(result.publishedAt)}
                    </AppText>

                    <Divider style={styles.divider} />

                    {/* Big score */}
                    <View style={styles.scoreBlock}>
                        <View style={styles.scorePrimary}>
                            <AppText style={[styles.totalMarks, { color: overallColour }]}>
                                {result.totalMarks}
                            </AppText>
                            <AppText variant="body1" tertiary>
                                / {result.maxTotalMarks}
                            </AppText>
                        </View>

                        {result.percentage != null && (
                            <AppText
                                style={[styles.percentage, { color: overallColour }]}
                            >
                                {formatPercentage(result.percentage, 1)}
                            </AppText>
                        )}

                        {result.classRank && (
                            <RankBadge rank={result.classRank} style={styles.rankBadge} />
                        )}
                    </View>

                    {/* Pass/fail summary */}
                    <View style={styles.pfRow}>
                        {passedCount > 0 && (
                            <View style={[styles.pfChip, styles.pfPassChip]}>
                                <AppText style={styles.pfChipText} color={Colors.success}>
                                    ✓ {passedCount} Passed
                                </AppText>
                            </View>
                        )}
                        {failedCount > 0 && (
                            <View style={[styles.pfChip, styles.pfFailChip]}>
                                <AppText style={styles.pfChipText} color={Colors.error}>
                                    ✗ {failedCount} Failed
                                </AppText>
                            </View>
                        )}
                        {absentCount > 0 && (
                            <View style={[styles.pfChip, styles.pfAbsentChip]}>
                                <AppText style={styles.pfChipText} color={Colors.textTertiary}>
                                    {absentCount} Absent
                                </AppText>
                            </View>
                        )}
                    </View>

                    {/* Teacher remarks */}
                    {result.teacherRemarks && (
                        <>
                            <Divider style={styles.divider} />
                            <View style={styles.remarksBox}>
                                <AppText variant="caption" secondary>Teacher's remarks</AppText>
                                <AppText variant="body2" style={styles.remarksText}>
                                    {result.teacherRemarks}
                                </AppText>
                            </View>
                        </>
                    )}
                </AppCard>

                {/* ── Subject breakdown ─────────────────────────────────────── */}
                <SectionHeader
                    title="Subject Results"
                    count={result.results.length}
                    compact
                    style={styles.subjectHeader}
                />

                {/* Column header */}
                <View style={styles.colHeader}>
                    <AppText style={[styles.colText, { flex: 1 }]}>Subject</AppText>
                    <AppText style={[styles.colText, { width: 72, textAlign: 'center' }]}>Marks</AppText>
                    <AppText style={[styles.colText, { width: 40, textAlign: 'center' }]}>Grade</AppText>
                    <AppText style={[styles.colText, { width: 44, textAlign: 'center' }]}>P/F</AppText>
                </View>

                {/* Subject rows */}
                <View style={styles.subjectList}>
                    {result.results
                        .sort((a, b) => {
                            // Show failed subjects first, then passed, then absent
                            if (a.isAbsent !== b.isAbsent) return a.isAbsent ? 1 : -1;
                            if (a.isPassed !== b.isPassed) {
                                if (a.isPassed === false) return -1;
                                if (b.isPassed === false) return 1;
                            }
                            return a.subjectName.localeCompare(b.subjectName);
                        })
                        .map((r) => (
                            <SubjectResultRow key={r.subjectId} result={r} />
                        ))}
                </View>

                {/* Progress chart link */}
                <AppButton
                    label="📈 View Progress Over Time"
                    variant="ghost"
                    onPress={() =>
                        navigation.navigate('ProgressChart', { studentId })
                    }
                    fullWidth
                    style={styles.progressBtn}
                />

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
    summaryCard: {
        marginBottom: Spacing[4],
        gap: Spacing[2],
    },
    examTypePill: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    examTypeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.primary,
    },
    examTitle: {
        lineHeight: 26,
    },
    divider: {
        marginVertical: Spacing[2],
    },
    scoreBlock: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing[3],
        flexWrap: 'wrap',
    },
    scorePrimary: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing[1],
    },
    totalMarks: {
        fontSize: 44,
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
        lineHeight: 52,
    },
    percentage: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.semiBold,
        fontVariant: ['tabular-nums'],
    },
    rankBadge: {
        marginLeft: 'auto',
    },
    pfRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
        marginTop: Spacing[1],
    },
    pfChip: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    pfPassChip: { backgroundColor: Colors.successLight },
    pfFailChip: { backgroundColor: Colors.errorLight },
    pfAbsentChip: { backgroundColor: Colors.surfaceSecondary },
    pfChipText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
    },
    remarksBox: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing[3],
        gap: Spacing[1],
    },
    remarksText: { lineHeight: 20 },
    subjectHeader: {
        paddingHorizontal: Layout.screenPaddingH,
    },
    colHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surfaceSecondary,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    colText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.textTertiary,
        textTransform: 'uppercase',
    },
    subjectList: {
        marginBottom: Spacing[4],
    },
    progressBtn: {
        marginHorizontal: Layout.screenPaddingH,
    },
});