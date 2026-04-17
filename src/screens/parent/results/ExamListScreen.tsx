import React, { useCallback } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
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
import { AppText } from '../../../components/common/AppText';
import { AppCard } from '../../../components/common/AppCard';
import { AppButton } from '../../../components/common/AppButton';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { GradeBadge, PassFailBadge, RankBadge }
    from '../../../components/marks/GradeBadge';
import { useActiveChild } from '../../../hooks/useActiveChild';
import {
    useGetChildResultsQuery,
} from '../../../services/parent/results.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDate, formatRelative } from '../../../utils/date.utils';
import { formatPercentage } from '../../../utils/format.utils';
import { gradeColour } from '../../../utils/format.utils';
import type { PublishedExamResult } from '../../../types/exam.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'ExamList'
>['route'];
type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Exam type label ──────────────────────────────────────────────────────────

const EXAM_TYPE_LABELS: Record<string, string> = {
    UNIT_TEST: 'Unit Test',
    MIDTERM: 'Midterm',
    FINAL: 'Final',
    QUARTERLY: 'Quarterly',
    HALF_YEARLY: 'Half Yearly',
    ANNUAL: 'Annual',
    INTERNAL: 'Internal',
};

// ─── Result card ──────────────────────────────────────────────────────────────

interface ResultCardProps {
    result: PublishedExamResult;
    studentId: string;
    onPress: () => void;
}

function ResultCard({ result, studentId, onPress }: ResultCardProps) {
    const passed = result.results.filter((r) => r.isPassed === true).length;
    const failed = result.results.filter((r) => r.isPassed === false).length;
    const absent = result.results.filter((r) => r.isAbsent).length;
    const colour = result.percentage != null
        ? gradeColour(
            result.percentage >= 90 ? 'A+' :
                result.percentage >= 80 ? 'A' :
                    result.percentage >= 70 ? 'B+' :
                        result.percentage >= 60 ? 'B' :
                            result.percentage >= 50 ? 'C' :
                                result.percentage >= 35 ? 'D' : 'F',
        )
        : Colors.textTertiary;

    return (
        <AppCard onPress={onPress} noPadding style={styles.resultCard}>
            <View style={styles.cardInner}>
                {/* Top row: exam type + rank */}
                <View style={styles.topRow}>
                    <View style={styles.typePill}>
                        <AppText style={styles.typeText}>
                            {EXAM_TYPE_LABELS[result.examType] ?? result.examType}
                        </AppText>
                    </View>
                    <View style={styles.topRight}>
                        {result.classRank && (
                            <RankBadge rank={result.classRank} />
                        )}
                    </View>
                </View>

                {/* Exam name */}
                <AppText variant="subtitle1" numberOfLines={1} style={styles.examName}>
                    {result.examName}
                </AppText>

                {/* Published date */}
                <AppText variant="caption" secondary>
                    Published {formatRelative(result.publishedAt)}
                </AppText>

                {/* Score row */}
                <View style={styles.scoreRow}>
                    {/* Total marks */}
                    <View style={styles.totalBlock}>
                        <AppText style={[styles.totalMarks, { color: colour }]}>
                            {result.totalMarks}
                        </AppText>
                        <AppText variant="caption" tertiary>
                            / {result.maxTotalMarks}
                        </AppText>
                    </View>

                    {/* Percentage */}
                    {result.percentage != null && (
                        <View style={styles.pctBlock}>
                            <AppText style={[styles.pctText, { color: colour }]}>
                                {formatPercentage(result.percentage, 0)}
                            </AppText>
                        </View>
                    )}

                    {/* Pass/fail summary */}
                    <View style={styles.pfSummary}>
                        {passed > 0 && (
                            <AppText style={styles.passCount} color={Colors.success}>
                                {passed}P
                            </AppText>
                        )}
                        {failed > 0 && (
                            <AppText style={styles.failCount} color={Colors.error}>
                                {failed}F
                            </AppText>
                        )}
                        {absent > 0 && (
                            <AppText style={styles.absentCount} color={Colors.textTertiary}>
                                {absent}AB
                            </AppText>
                        )}
                    </View>
                </View>

                {/* Subject strip (first 4) */}
                <View style={styles.subjectStrip}>
                    {result.results.slice(0, 4).map((r) => (
                        <View key={r.subjectId} style={styles.subjectChip}>
                            <AppText style={styles.subjectName} numberOfLines={1}>
                                {r.subjectName.length > 8
                                    ? r.subjectName.slice(0, 7) + '…'
                                    : r.subjectName}
                            </AppText>
                            {r.isAbsent ? (
                                <AppText style={styles.subjectMark} color={Colors.textTertiary}>AB</AppText>
                            ) : r.marksObtained != null ? (
                                <AppText
                                    style={[
                                        styles.subjectMark,
                                        { color: r.isPassed === false ? Colors.error : Colors.textPrimary },
                                    ]}
                                >
                                    {r.marksObtained}
                                </AppText>
                            ) : (
                                <AppText style={styles.subjectMark} color={Colors.textTertiary}>—</AppText>
                            )}
                        </View>
                    ))}
                    {result.results.length > 4 && (
                        <View style={styles.subjectChip}>
                            <AppText style={styles.moreText}>
                                +{result.results.length - 4} more
                            </AppText>
                        </View>
                    )}
                </View>
            </View>
        </AppCard>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ExamListScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const { studentId } = route.params;

    const { activeChild } = useActiveChild();

    const {
        data,
        isLoading,
        refetch,
    } = useGetChildResultsQuery(studentId);

    const results = data?.data ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    const renderItem: ListRenderItem<PublishedExamResult> = useCallback(
        ({ item }) => (
            <ResultCard
                result={item}
                studentId={studentId}
                onPress={() =>
                    navigation.navigate('ExamResult', {
                        examId: item.examId,
                        studentId,
                        examName: item.examName,
                    })
                }
            />
        ),
        [navigation, studentId],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <FlatList
                data={isLoading ? [] : results}
                keyExtractor={(item) => item.examId}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        {activeChild && (
                            <View style={styles.childContext}>
                                <AppText variant="h4">
                                    {activeChild.firstName}'s Results
                                </AppText>
                                <AppText variant="body2" secondary>
                                    {activeChild.className} {activeChild.section}
                                </AppText>
                            </View>
                        )}

                        {/* Progress chart link */}
                        {results.length > 1 && (
                            <AppButton
                                label="📈 View Progress Chart"
                                variant="secondary"
                                size="sm"
                                onPress={() =>
                                    navigation.navigate('ProgressChart', { studentId })
                                }
                                style={styles.chartBtn}
                            />
                        )}

                        <SectionHeader title="Exams" count={results.length} compact />
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.skeletons}>
                            {[1, 2, 3].map((i) => (
                                <SkeletonCard key={i} lines={4} style={styles.resultCard} />
                            ))}
                        </View>
                    ) : (
                        <PresetEmptyState
                            preset="results"
                            compact
                        />
                    )
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
            />
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingBottom: Spacing[10],
    },
    header: {
        paddingTop: Spacing[4],
        gap: Spacing[3],
        marginBottom: Spacing[2],
    },
    childContext: {
        gap: Spacing[1],
    },
    chartBtn: {
        alignSelf: 'flex-start',
    },
    resultCard: {
        overflow: 'hidden',
    },
    cardInner: {
        padding: Spacing[4],
        gap: Spacing[2],
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    typePill: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    typeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.primary,
    },
    topRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    examName: { lineHeight: 22 },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[4],
        marginTop: Spacing[1],
    },
    totalBlock: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    totalMarks: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    pctBlock: {},
    pctText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semiBold,
        fontVariant: ['tabular-nums'],
    },
    pfSummary: {
        flexDirection: 'row',
        gap: Spacing[2],
        marginLeft: 'auto',
    },
    passCount: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    failCount: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    absentCount: {
        fontSize: FontSize.sm,
    },
    subjectStrip: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
        marginTop: Spacing[1],
        paddingTop: Spacing[2],
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    subjectChip: {
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing[2],
        paddingVertical: Spacing[1],
        gap: 2,
        minWidth: 44,
    },
    subjectName: {
        fontSize: 8,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    subjectMark: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    moreText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    skeletons: {
        gap: Spacing[3],
    },
});