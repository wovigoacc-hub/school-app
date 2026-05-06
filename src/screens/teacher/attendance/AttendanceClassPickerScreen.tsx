import React, { useCallback, useMemo } from 'react';
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
import { AppAvatar } from '../../../components/common/AppAvatar';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import { useGetAttendanceSessionQuery } from '../../../services/teacher/attendance.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { todayISODate, formatDateFull } from '../../../utils/date.utils';
import type { TeacherClass } from '../../../types/teacher.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Submission status for a class today ──────────────────────────────────────

const SUBMISSION_CONFIG = {
    submitted: { icon: '✓', label: 'Marked', colour: Colors.success, bg: Colors.successLight },
    partial: { icon: '•', label: 'Partial', colour: Colors.warning, bg: Colors.warningLight },
    pending: { icon: '•', label: 'Not marked', colour: Colors.textTertiary, bg: Colors.surfaceSecondary },
} as const;

// ─── Class row ────────────────────────────────────────────────────────────────

interface ClassAttendanceRowProps {
    cls: TeacherClass;
    date: string;
    onPress: (classId: string, subjectId?: string) => void;
}

function ClassAttendanceRow({ cls, date, onPress }: ClassAttendanceRowProps) {
    return (
        <AppCard
            noPadding
            style={styles.classCard}
        >
            <View style={styles.classRow}>
                {/* Class badge */}
                <View style={styles.classBadge}>
                    <AppText style={styles.classBadgeText}>
                        {cls.name.charAt(0)}{cls.section}
                    </AppText>
                </View>

                {/* Class info */}
                <View style={styles.classInfo}>
                    <AppText variant="subtitle2">
                        {cls.name} {cls.section}
                    </AppText>
                    <AppText variant="caption" secondary>
                        {cls.studentCount} students
                        {cls.isClassTeacher ? ' • Class Teacher' : ''}
                    </AppText>
                </View>
            </View>

            <View style={styles.subjectList}>
                {/* 1. Always show Daily Attendance option if they are class teacher or in ONCE_DAILY mode */}
                {(cls.isClassTeacher || cls.attendanceMode === 'ONCE_DAILY') && (
                    <DailyAttendanceRow
                        classId={cls.classId}
                        date={date}
                        onPress={() => onPress(cls.classId)}
                    />
                )}

                {/* 2. List of Subjects */}
                {cls.mySubjects.map((subj, i) => (
                    <SubjectRow
                        key={subj.subjectId}
                        subjectId={subj.subjectId}
                        subjectName={subj.subjectName}
                        classId={cls.classId}
                        date={date}
                        isLast={i === cls.mySubjects.length - 1}
                        onPress={() => onPress(cls.classId, subj.subjectId)}
                    />
                ))}
            </View>
        </AppCard>
    );
}

// ─── Daily attendance row ───────────────────────────────────────────────────

interface DailyAttendanceRowProps {
    classId: string;
    date: string;
    onPress: () => void;
}

function DailyAttendanceRow({ classId, date, onPress }: DailyAttendanceRowProps) {
    const { data: sessionData } = useGetAttendanceSessionQuery({
        classId,
        date,
    });

    const session = sessionData?.data;
    const isSubmitted = !!session?.isSubmitted;
    const presentCount = session?.presentCount ?? 0;
    const totalCount = session?.totalStudents ?? 0;

    const statusConfig = isSubmitted
        ? SUBMISSION_CONFIG.submitted
        : SUBMISSION_CONFIG.pending;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.subjectRow, styles.subjectRowBorder]}
            accessibilityRole="button"
            accessibilityLabel="Daily attendance"
        >
            <View style={styles.dailyIcon}>
                <AppText style={styles.dailyIconText}>📅</AppText>
            </View>
            <AppText variant="body2" style={[styles.subjectName, { fontWeight: FontWeight.semiBold }]}>
                Daily Attendance
            </AppText>

            <View style={styles.subjectStatus}>
                {isSubmitted && (
                    <AppText variant="caption" tertiary>
                        {presentCount}/{totalCount}
                    </AppText>
                )}
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <AppText style={[styles.statusIcon, { color: statusConfig.colour }]}>
                        {statusConfig.icon}
                    </AppText>
                    <AppText style={[styles.statusLabel, { color: statusConfig.colour }]}>
                        {statusConfig.label}
                    </AppText>
                </View>
                <AppText secondary style={styles.subjectChevron}>›</AppText>
            </View>
        </TouchableOpacity>
    );
}

// ─── Subject row (period-wise mode) ───────────────────────────────────────────

interface SubjectRowProps {
    subjectId: string;
    subjectName: string;
    classId: string;
    date: string;
    isLast: boolean;
    onPress: () => void;
}

function SubjectRow({
    subjectId, subjectName, classId, date, isLast, onPress,
}: SubjectRowProps) {
    const { data: sessionData } = useGetAttendanceSessionQuery({
        classId,
        date,
        subjectId,
    });

    const session = sessionData?.data;
    const isSubmitted = !!session?.isSubmitted;
    const presentCount = session?.presentCount ?? 0;
    const totalCount = session?.totalStudents ?? 0;

    const statusConfig = isSubmitted
        ? SUBMISSION_CONFIG.submitted
        : SUBMISSION_CONFIG.pending;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.subjectRow,
                !isLast && styles.subjectRowBorder,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${subjectName} attendance`}
        >
            <AppText variant="body2" style={styles.subjectName}>
                {subjectName}
            </AppText>

            <View style={styles.subjectStatus}>
                {isSubmitted && (
                    <AppText variant="caption" tertiary>
                        {presentCount}/{totalCount}
                    </AppText>
                )}
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <AppText style={[styles.statusIcon, { color: statusConfig.colour }]}>
                        {statusConfig.icon}
                    </AppText>
                    <AppText style={[styles.statusLabel, { color: statusConfig.colour }]}>
                        {statusConfig.label}
                    </AppText>
                </View>
                <AppText secondary style={styles.subjectChevron}>›</AppText>
            </View>
        </TouchableOpacity>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceClassPickerScreen() {
    const navigation = useNavigation<Nav>();
    const today = todayISODate();

    const {
        data: classesData,
        isLoading,
        refetch,
    } = useGetMyClassesQuery();

    const classes = classesData?.data ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    const handleClassPress = useCallback(
        (classId: string, subjectId?: string) => {
            navigation.navigate('AttendanceMark', {
                classId,
                date: today,
                subjectId,
            });
        },
        [navigation, today],
    );

    const renderItem: ListRenderItem<TeacherClass> = useCallback(
        ({ item }) => (
            <ClassAttendanceRow
                cls={item}
                date={today}
                onPress={handleClassPress}
            />
        ),
        [today, handleClassPress],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={classes}
                keyExtractor={(item) => item.classId}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <AppText variant="h4">{formatDateFull(today)}</AppText>
                        <AppText variant="body2" secondary>
                            Select a class to mark attendance
                        </AppText>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <SkeletonList count={4} style={styles.skeleton} />
                    ) : (
                        <PresetEmptyState
                            preset="search"
                            title="No classes assigned"
                            message="Your class assignments will appear here."
                            compact
                        />
                    )
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
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
        paddingBottom: Spacing[4],
        gap: Spacing[1],
    },
    classCard: {
        overflow: 'hidden',
    },
    classRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        gap: Spacing[3],
    },
    classBadge: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.teacherLight,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    classBadgeText: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.teacher,
    },
    classInfo: { flex: 1 },
    subjectCount: {
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    subjectCountText: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        fontWeight: FontWeight.medium,
    },
    chevron: { fontSize: FontSize.xl },
    subjectList: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        marginTop: 0,
    },
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing[3],
        paddingHorizontal: Spacing[4],
        paddingLeft: Spacing[4] + 48 + Spacing[3],
    },
    subjectRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    subjectName: { flex: 1 },
    subjectStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
        gap: 4,
    },
    statusIcon: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    statusLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
    },
    subjectChevron: { fontSize: FontSize.lg },
    dailyIcon: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.successLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[3],
    },
    dailyIconText: {
        fontSize: FontSize.lg,
    },
    separator: { height: Spacing[2] },
    skeleton: { paddingHorizontal: Layout.screenPaddingH },
});
