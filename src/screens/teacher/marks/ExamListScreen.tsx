import React, { useCallback } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { AppText } from '../../../components/common/AppText';
import { AppCard } from '../../../components/common/AppCard';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { useGetOpenExamsQuery } from '../../../services/teacher/exams.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDeadlineLabel, formatDate } from '../../../utils/date.utils';
import type { TeacherOpenExam } from '../../../types/exam.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Exam type label map ──────────────────────────────────────────────────────

const EXAM_TYPE_LABELS: Record<string, string> = {
    UNIT_TEST: 'Unit Test',
    MIDTERM: 'Midterm',
    FINAL: 'Final',
    QUARTERLY: 'Quarterly',
    HALF_YEARLY: 'Half Yearly',
    ANNUAL: 'Annual',
    INTERNAL: 'Internal',
};

// ─── Urgency colour based on days remaining ───────────────────────────────────

function getDeadlineColour(daysRemaining: number): string {
    if (daysRemaining <= 0) return Colors.error;
    if (daysRemaining <= 1) return Colors.error;
    if (daysRemaining <= 3) return Colors.warning;
    return Colors.success;
}

// ─── Subject × class entry button ────────────────────────────────────────────

interface EntryButtonProps {
    examId: string;
    examName: string;
    subjectId: string;
    subjectName: string;
    maxMarks: number;
    classId: string;
    className: string;
    section: string;
    onPress: () => void;
}

function EntryButton({
    subjectName,
    className,
    section,
    maxMarks,
    onPress,
}: EntryButtonProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={styles.entryBtn}
            accessibilityRole="button"
            accessibilityLabel={`Enter marks for ${subjectName} — ${className} ${section}`}
        >
            <View style={styles.entryBtnLeft}>
                <AppText variant="subtitle2" numberOfLines={1} style={styles.entrySubject}>
                    {subjectName}
                </AppText>
                <AppText variant="caption" secondary>
                    {className} {section} · Max {maxMarks}
                </AppText>
            </View>
            <View style={styles.entryBtnRight}>
                <AppText style={styles.entryArrow} color={Colors.primary}>
                    Enter →
                </AppText>
            </View>
        </TouchableOpacity>
    );
}

// ─── Exam card ────────────────────────────────────────────────────────────────

interface ExamCardProps {
    exam: TeacherOpenExam;
    onEntry: (params: {
        examId: string;
        examName: string;
        subjectId: string;
        subjectName: string;
        classId: string;
        className: string;
        section: string;
        maxMarks: number;
    }) => void;
}

function ExamCard({ exam, onEntry }: ExamCardProps) {
    const deadlineColour = getDeadlineColour(exam.daysRemaining);
    const deadlineLabel = formatDeadlineLabel(exam.markEntryEnd);

    return (
        <AppCard noPadding style={styles.examCard}>
            {/* Exam header */}
            <View style={styles.examHeader}>
                <View style={styles.examHeaderLeft}>
                    <View style={styles.examTypePill}>
                        <AppText style={styles.examTypeText}>
                            {EXAM_TYPE_LABELS[exam.type] ?? exam.type}
                        </AppText>
                    </View>
                    <AppText variant="subtitle1" numberOfLines={1} style={styles.examName}>
                        {exam.name}
                    </AppText>
                    <AppText variant="caption" secondary>
                        {exam.academicYearName}
                    </AppText>
                </View>

                {/* Deadline badge */}
                <View style={[styles.deadlineBadge, { borderColor: deadlineColour }]}>
                    <AppText style={[styles.deadlineText, { color: deadlineColour }]}>
                        {deadlineLabel}
                    </AppText>
                    <AppText style={[styles.deadlineEnds, { color: deadlineColour }]}>
                        {formatDate(exam.markEntryEnd)}
                    </AppText>
                </View>
            </View>

            {/* Subject × class entry buttons */}
            <View style={styles.entryList}>
                {exam.myClasses.map((cls) =>
                    exam.mySubjects.map((subj) => (
                        <EntryButton
                            key={`${cls.classId}-${subj.subjectId}`}
                            examId={exam.examId}
                            examName={exam.name}
                            subjectId={subj.subjectId}
                            subjectName={subj.subjectName}
                            maxMarks={subj.maxMarks}
                            classId={cls.classId}
                            className={cls.className}
                            section={cls.section}
                            onPress={() =>
                                onEntry({
                                    examId: exam.examId,
                                    examName: exam.name,
                                    subjectId: subj.subjectId,
                                    subjectName: subj.subjectName,
                                    classId: cls.classId,
                                    className: cls.className,
                                    section: cls.section,
                                    maxMarks: subj.maxMarks,
                                })
                            }
                        />
                    )),
                )}
            </View>
        </AppCard>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ExamListScreen() {
    const navigation = useNavigation<Nav>();

    const {
        data,
        isLoading,
        refetch,
    } = useGetOpenExamsQuery();

    const exams = data?.data ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    const handleEntry = useCallback(
        (params: {
            examId: string; examName: string;
            subjectId: string; subjectName: string;
            classId: string; className: string;
            section: string; maxMarks: number;
        }) => {
            navigation.navigate('MarkSheet', params);
        },
        [navigation],
    );

    const renderItem: ListRenderItem<TeacherOpenExam> = useCallback(
        ({ item }) => (
            <ExamCard
                exam={item}
                onEntry={handleEntry}
            />
        ),
        [handleEntry],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={isLoading ? [] : exams}
                keyExtractor={(item) => item.examId}
                renderItem={renderItem}
                ListHeaderComponent={
                    <SectionHeader
                        title="Open Mark Entry"
                        count={exams.length}
                        style={styles.header}
                    />
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.skeletons}>
                            {[1, 2].map((i) => <SkeletonCard key={i} lines={4} style={styles.examCard} />)}
                        </View>
                    ) : (
                        <PresetEmptyState
                            preset="search"
                            title="No open exams"
                            message="Exams with open mark entry windows will appear here."
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
    },
    examCard: {
        overflow: 'hidden',
    },
    examHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: Spacing[4],
        gap: Spacing[3],
    },
    examHeaderLeft: {
        flex: 1,
        gap: Spacing[1],
    },
    examTypePill: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
        marginBottom: Spacing[1],
    },
    examTypeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.primary,
    },
    examName: {
        lineHeight: 22,
    },
    deadlineBadge: {
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[2],
        minWidth: 88,
        flexShrink: 0,
    },
    deadlineText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
    },
    deadlineEnds: {
        fontSize: FontSize.xs,
        textAlign: 'center',
        marginTop: 2,
    },
    entryList: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    entryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        gap: Spacing[3],
    },
    entryBtnLeft: { flex: 1 },
    entrySubject: { marginBottom: 2 },
    entryBtnRight: {},
    entryArrow: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
    },
    skeletons: {
        gap: Spacing[3],
    },
});