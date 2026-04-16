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
import { Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppCard } from '../../../components/common/AppCard';
import { AppAvatar } from '../../../components/common/AppAvatar';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { useAuth } from '../../../hooks/useAuth';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import { useGetOpenExamsQuery } from '../../../services/teacher/exams.service';
import { useGetTeacherHomeworkQuery } from '../../../services/teacher/homework.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDeadlineLabel } from '../../../utils/date.utils';
import type { TeacherClass, TeacherPendingTasks } from '../../../types/teacher.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Pending task card ────────────────────────────────────────────────────────

interface PendingTaskCardProps {
    icon: string;
    title: string;
    subtitle: string;
    count?: number;
    urgency?: 'high' | 'medium' | 'low';
    onPress: () => void;
}

function PendingTaskCard({
    icon, title, subtitle, count, urgency = 'medium', onPress,
}: PendingTaskCardProps) {
    const borderColor =
        urgency === 'high' ? Colors.error :
            urgency === 'medium' ? Colors.warning :
                Colors.border;

    return (
        <AppCard
            onPress={onPress}
            style={[styles.taskCard, { borderLeftColor: borderColor, borderLeftWidth: 4 }]}
            noPadding
        >
            <View style={styles.taskInner}>
                <AppText style={styles.taskIcon}>{icon}</AppText>
                <View style={styles.taskText}>
                    <AppText variant="subtitle2" numberOfLines={1}>{title}</AppText>
                    <AppText variant="caption" secondary numberOfLines={1}>{subtitle}</AppText>
                </View>
                {count !== undefined && (
                    <View style={[
                        styles.taskCount,
                        { backgroundColor: urgency === 'high' ? Colors.errorLight : Colors.warningLight },
                    ]}>
                        <AppText style={[
                            styles.taskCountText,
                            { color: urgency === 'high' ? Colors.error : Colors.warning },
                        ]}>
                            {count}
                        </AppText>
                    </View>
                )}
                <AppText style={styles.chevron} secondary>›</AppText>
            </View>
        </AppCard>
    );
}

// ─── Class tile ───────────────────────────────────────────────────────────────

function ClassTile({
    cls,
    onPress,
}: {
    cls: TeacherClass;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={styles.classTile}
            accessibilityRole="button"
            accessibilityLabel={`${cls.name} ${cls.section}`}
        >
            <View style={styles.classTileBadge}>
                <AppText style={styles.classTileText}>
                    {cls.name.charAt(0)}{cls.section}
                </AppText>
            </View>
            <AppText variant="label" center numberOfLines={1} style={styles.classTileLabel}>
                {cls.name} {cls.section}
            </AppText>
            <AppText variant="caption" secondary center>
                {cls.studentCount} students
            </AppText>
        </TouchableOpacity>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TeacherHomeScreen() {
    const navigation = useNavigation<Nav>();
    const { displayName, userId } = useAuth();

    const {
        data: classesData,
        isLoading: classesLoading,
        refetch: refetchClasses,
        isFetching: classesFetching,
    } = useGetMyClassesQuery();

    const {
        data: examsData,
        refetch: refetchExams,
    } = useGetOpenExamsQuery();

    const {
        data: homeworkData,
        refetch: refetchHomework,
    } = useGetTeacherHomeworkQuery({ overdue: true, limit: 5 });

    const classes = classesData?.data ?? [];
    const openExams = examsData?.data ?? [];
    const overdueHW = homeworkData?.data ?? [];

    const refetchAll = useCallback(async () => {
        await Promise.all([refetchClasses(), refetchExams(), refetchHomework()]);
    }, [refetchClasses, refetchExams, refetchHomework]);

    const { refreshing, onRefresh } = useRefresh(refetchAll);

    // ─── Build pending tasks ───────────────────────────────────────────────
    // In a real app these would come from the TeacherPendingTasks endpoint.
    // For now derived from the class/exam/homework data.

    const hasUrgentTasks = openExams.length > 0 || overdueHW.length > 0;

    const renderHeader = useCallback(() => (
        <View>
            {/* Greeting */}
            <View style={styles.greeting}>
                <View style={styles.greetingText}>
                    <AppText variant="h3">
                        Good {getGreeting()}! 👋
                    </AppText>
                    <AppText variant="body1" secondary numberOfLines={1}>
                        {displayName}
                    </AppText>
                </View>
                <AppAvatar
                    firstName={displayName.split(' ')[0]}
                    lastName={displayName.split(' ')[1]}
                    size="lg"
                />
            </View>

            {/* Pending tasks section */}
            {(openExams.length > 0 || overdueHW.length > 0) && (
                <>
                    <SectionHeader
                        title="Needs Attention"
                        count={openExams.length + overdueHW.length}
                    />

                    {/* Open mark entries */}
                    {openExams.map((exam) => (
                        <PendingTaskCard
                            key={exam.examId}
                            icon="✏️"
                            title={`${exam.name} — Mark Entry`}
                            subtitle={formatDeadlineLabel(exam.markEntryEnd)}
                            count={exam.myClasses.length}
                            urgency={exam.daysRemaining <= 1 ? 'high' : 'medium'}
                            onPress={() =>
                                navigation.navigate('Marks', { examId: exam.examId })
                            }
                        />
                    ))}

                    {/* Overdue homework */}
                    {overdueHW.map((hw) => (
                        <PendingTaskCard
                            key={hw.id}
                            icon="📚"
                            title={hw.title}
                            subtitle={`${hw.subjectName} · ${hw.pendingCount} pending`}
                            count={hw.pendingCount}
                            urgency="medium"
                            onPress={() =>
                                navigation.navigate('HomeworkDetail', { homeworkId: hw.id })
                            }
                        />
                    ))}

                    <Spacer size={Spacing[4]} />
                </>
            )}

            {/* Quick actions */}
            <SectionHeader title="Quick Actions" />
            <View style={styles.quickActions}>
                <QuickActionBtn
                    icon="📋"
                    label="Attendance"
                    onPress={() => navigation.navigate('AttendanceClassPicker')}
                />
                <QuickActionBtn
                    icon="📚"
                    label="Homework"
                    onPress={() => navigation.navigate('HomeworkList')}
                />
                <QuickActionBtn
                    icon="✏️"
                    label="Marks"
                    onPress={() => navigation.navigate('ExamList')}
                />
                <QuickActionBtn
                    icon="📣"
                    label="Announce"
                    onPress={() => navigation.navigate('AnnouncementFeed')}
                />
            </View>

            <Spacer size={Spacing[4]} />

            {/* My classes */}
            <SectionHeader
                title="My Classes"
                count={classes.length}
            />

            {classesLoading && (
                <>
                    <SkeletonCard style={styles.skeletonSpacing} />
                    <SkeletonCard style={styles.skeletonSpacing} />
                </>
            )}

            {!classesLoading && classes.length === 0 && (
                <PresetEmptyState
                    preset="search"
                    title="No classes assigned"
                    message="Your class assignments will appear here once set up by the admin."
                    compact
                />
            )}

            {!classesLoading && classes.length > 0 && (
                <View style={styles.classGrid}>
                    {classes.map((cls) => (
                        <ClassTile
                            key={cls.classId}
                            cls={cls}
                            onPress={() =>
                                navigation.navigate('AttendanceClassPicker', { classId: cls.classId })
                            }
                        />
                    ))}
                </View>
            )}

            <Spacer size={Spacing[6]} />
        </View>
    ), [
        displayName, openExams, overdueHW, classes,
        classesLoading, navigation,
    ]);

    return (
        <ScreenWrapper noKeyboard noPadding>
            <FlatList
                data={[]}   // header-only list for scroll behaviour
                renderItem={null}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </ScreenWrapper>
    );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickActionBtn({
    icon, label, onPress,
}: {
    icon: string;
    label: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={styles.quickBtn}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <View style={styles.quickBtnIcon}>
                <AppText style={styles.quickBtnEmoji}>{icon}</AppText>
            </View>
            <AppText variant="caption" center numberOfLines={1}>
                {label}
            </AppText>
        </TouchableOpacity>
    );
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingBottom: Spacing[10],
    },
    greeting: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing[5],
        marginBottom: Spacing[5],
    },
    greetingText: { flex: 1, marginRight: Spacing[3] },
    taskCard: {
        marginBottom: Spacing[2],
        overflow: 'hidden',
    },
    taskInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[3],
        gap: Spacing[3],
    },
    taskIcon: { fontSize: 22 },
    taskText: { flex: 1 },
    taskCount: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
        minWidth: 28,
        alignItems: 'center',
    },
    taskCountText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    chevron: { fontSize: FontSize.xl },
    quickActions: {
        flexDirection: 'row',
        gap: Spacing[3],
        marginBottom: Spacing[2],
    },
    quickBtn: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing[1],
    },
    quickBtnIcon: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.primarySubtle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickBtnEmoji: { fontSize: 22 },
    classGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[3],
    },
    classTile: {
        width: '30%',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing[3],
        gap: Spacing[1],
    },
    classTileBadge: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.primarySubtle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    classTileText: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
    },
    classTileLabel: { marginTop: Spacing[1] },
    skeletonSpacing: { marginBottom: Spacing[3] },
});