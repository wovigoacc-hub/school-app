import React, {
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Alert,
    type ListRenderItem,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { StudentAttendanceRow } from '../../../components/attendance/StudentAttendanceRow';
import { SessionSummary } from '../../../components/attendance/AttendanceSummaryCard';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetAttendanceSessionQuery,
    useSubmitAttendanceMutation,
} from '../../../services/teacher/attendance.service';
import { useGetClassStudentsQuery } from '../../../services/teacher/classes.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDateFull, todayISODate } from '../../../utils/date.utils';
import { countStatuses } from '../../../utils/attendance.utils';
import type { AttendanceStatus, LocalAttendanceMark } from '../../../types/attendance.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'AttendanceMark'
>['route'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceMarkScreen() {
    const dispatch = useAppDispatch();
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NativeStackNavigationProp<TeacherNavigatorParamList>>();

    const { classId, date = todayISODate(), subjectId } = route.params;

    // ─── Server data ────────────────────────────────────────────────────────
    const {
        data: sessionData,
        isLoading: sessionLoading,
        refetch: refetchSession,
        isFetching,
    } = useGetAttendanceSessionQuery({ classId, date, subjectId });

    const { data: studentsData, isLoading: studentsLoading } =
        useGetClassStudentsQuery(classId);

    const session = sessionData?.data;
    const students = studentsData?.data ?? [];
    const isLoading = sessionLoading || studentsLoading;

    const { refreshing, onRefresh } = useRefresh(refetchSession);

    // ─── Local marks state ───────────────────────────────────────────────────
    // Start with the server session if already submitted, else default to PRESENT
    const [marks, setMarks] = useState<LocalAttendanceMark[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (!students.length) return;

        if (session?.records?.length) {
            // Pre-populate from server (already marked)
            setMarks(
                students.map((s) => {
                    const record = session.records.find((r) => r.studentId === s.id);
                    return {
                        studentId: s.id,
                        studentName: `${s.firstName} ${s.lastName}`,
                        rollNumber: s.rollNumber,
                        photoUrl: s.photoUrl,
                        status: (record?.status ?? 'PRESENT') as AttendanceStatus,
                        note: record?.note,
                        isLeave: record?.status === 'LEAVE',
                    };
                }),
            );
        } else {
            // Default all to PRESENT
            setMarks(
                students.map((s) => ({
                    studentId: s.id,
                    studentName: `${s.firstName} ${s.lastName}`,
                    rollNumber: s.rollNumber,
                    photoUrl: s.photoUrl,
                    status: 'PRESENT' as AttendanceStatus,
                    note: undefined,
                    isLeave: false,
                })),
            );
        }
        setIsDirty(false);
    }, [students, session]);

    // ─── Status change handler ───────────────────────────────────────────────
    const handleStatusChange = useCallback(
        (studentId: string, status: AttendanceStatus) => {
            setMarks((prev) =>
                prev.map((m) => m.studentId === studentId ? { ...m, status } : m),
            );
            setIsDirty(true);
        },
        [],
    );

    // ─── Summary counts ──────────────────────────────────────────────────────
    const counts = useMemo(
        () => countStatuses(marks.map((m) => m.status)),
        [marks],
    );

    // ─── Submit ──────────────────────────────────────────────────────────────
    const [submitAttendance, { isLoading: isSubmitting }] =
        useSubmitAttendanceMutation();

    const handleSubmit = useCallback(async () => {
        if (!marks.length) return;

        try {
            await submitAttendance({
                classId,
                subjectId,
                date,
                records: marks.map((m) => ({
                    studentId: m.studentId,
                    status: m.status,
                    note: m.note,
                })),
            }).unwrap();

            dispatch(showSuccessToast('Attendance submitted successfully'));
            setIsDirty(false);
            navigation.goBack();
        } catch (err: any) {
            const msg = err?.data?.message ?? 'Failed to submit attendance. Please try again.';
            dispatch(showErrorToast(msg));
        }
    }, [marks, classId, subjectId, date, submitAttendance, dispatch, navigation]);

    const confirmSubmit = useCallback(() => {
        const absentCount = counts.ABSENT;
        if (absentCount === 0) {
            handleSubmit();
            return;
        }
        Alert.alert(
            'Confirm Submission',
            `${absentCount} student${absentCount > 1 ? 's' : ''} will be marked absent. Proceed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', style: 'default', onPress: handleSubmit },
            ],
        );
    }, [counts.ABSENT, handleSubmit]);

    // ─── Render ──────────────────────────────────────────────────────────────
    const isAlreadySubmitted = !!session?.isSubmitted;
    const isLocked = isAlreadySubmitted && !isDirty;

    const renderItem: ListRenderItem<LocalAttendanceMark> = useCallback(
        ({ item }) => (
            <StudentAttendanceRow
                mark={item}
                onChange={handleStatusChange}
                locked={isAlreadySubmitted && !isDirty}
                showRoll
            />
        ),
        [handleStatusChange, isAlreadySubmitted, isDirty],
    );

    const ListHeader = useMemo(
        () => (
            <View>
                {/* Date + subject header */}
                <View style={styles.header}>
                    <AppText variant="h4">{session?.className ?? ''} {session?.section ?? ''}</AppText>
                    <AppText variant="body2" secondary>
                        {formatDateFull(date)}
                        {subjectId && session?.subjectName ? ` · ${session.subjectName}` : ''}
                    </AppText>
                </View>

                {/* Summary chips */}
                {marks.length > 0 && (
                    <SessionSummary
                        counts={counts}
                        date={date}
                        className={session?.className ?? ''}
                        section={session?.section ?? ''}
                        style={styles.summary}
                    />
                )}

                {/* Already submitted notice */}
                {isAlreadySubmitted && (
                    <View style={styles.submittedBanner}>
                        <AppText style={styles.submittedText}>
                            ✓ Attendance already submitted
                            {isDirty ? ' — you have unsaved changes' : ''}
                        </AppText>
                    </View>
                )}

                {/* Column headers */}
                <View style={styles.columnHeader}>
                    <AppText style={styles.colRoll}>#</AppText>
                    <AppText style={styles.colSpacer} />
                    <AppText style={styles.colName}>Student</AppText>
                    <AppText style={styles.colStatus}>Status</AppText>
                </View>
            </View>
        ),
        [session, date, subjectId, counts, marks.length, isAlreadySubmitted, isDirty],
    );

    if (isLoading) {
        return (
            <ScreenWrapper noKeyboard noPadding>
                <View style={styles.loadingHeader} />
                <SkeletonList count={8} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={marks}
                keyExtractor={(item) => item.studentId}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    <PresetEmptyState
                        preset="search"
                        title="No students"
                        message="No students found in this class."
                        compact
                    />
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                // Improve scroll performance for large classes
                removeClippedSubviews
                maxToRenderPerBatch={15}
                windowSize={10}
            />

            {/* Fixed submit bar */}
            {marks.length > 0 && (
                <View style={styles.submitBar}>
                    <View style={styles.submitBarLeft}>
                        <AppText variant="body2">
                            {counts.PRESENT}P · {counts.ABSENT}A
                            {(counts.LATE ?? 0) > 0 ? ` · ${counts.LATE}L` : ''}
                        </AppText>
                        <AppText variant="caption" secondary>
                            of {counts.total}
                        </AppText>
                    </View>
                    <AppButton
                        label={
                            isSubmitting ? 'Submitting…' :
                                isAlreadySubmitted && isDirty ? 'Update' :
                                    isAlreadySubmitted ? 'Re-submit' :
                                        'Submit'
                        }
                        onPress={confirmSubmit}
                        loading={isSubmitting}
                        style={styles.submitBtn}
                        size="sm"
                    />
                </View>
            )}
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    list: {
        paddingBottom: Spacing[10] + 64,  // clear submit bar
    },
    loadingHeader: {
        height: 80,
        backgroundColor: Colors.surface,
        margin: Spacing[4],
        borderRadius: BorderRadius.xl,
    },
    header: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[4],
        paddingBottom: Spacing[3],
        gap: Spacing[1],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    summary: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
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
    columnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surfaceSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    colRoll: { width: 28, fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right' },
    colSpacer: { width: 28 + Spacing[2] },
    colName: { flex: 1, fontSize: FontSize.xs, color: Colors.textTertiary },
    colStatus: { fontSize: FontSize.xs, color: Colors.textTertiary, width: 180 },
    submitBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    submitBarLeft: { gap: 2 },
    submitBtn: { minWidth: 100 },
});