import React, { useState, useCallback } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { AppButton } from '../../../components/common/AppButton';
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { TeacherHomeworkCard } from '../../../components/homework/HomeworkCard';
import {
    useGetTeacherHomeworkQuery,
    useDeleteHomeworkMutation,
} from '../../../services/teacher/homework.service';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import { useAppDispatch } from '../../../app/store';
import { showModal } from '../../../store/slices/uiSlice';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { HomeworkSummary } from '../../../types/homework.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Filter state ─────────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'OVERDUE';

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'EXPIRED', label: 'Expired' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeworkListScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [classFilter, setClassFilter] = useState<string | undefined>();

    const { data: classesData } = useGetMyClassesQuery();
    const classes = classesData?.data ?? [];

    const queryParams = {
        ...(statusFilter === 'ACTIVE' && { status: 'ACTIVE' }),
        ...(statusFilter === 'EXPIRED' && { status: 'EXPIRED' }),
        ...(statusFilter === 'OVERDUE' && { overdue: true }),
        ...(classFilter && { classId: classFilter }),
        limit: 20,
    };

    const {
        data: homeworkData,
        isLoading,
        refetch,
        isFetching,
    } = useGetTeacherHomeworkQuery(queryParams);

    const [deleteHomework] = useDeleteHomeworkMutation();

    const homework = homeworkData?.data ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Delete with confirmation ────────────────────────────────────────────
    const handleDelete = useCallback(
        (hw: HomeworkSummary) => {
            dispatch(
                showModal({
                    title: 'Delete Homework?',
                    message: `"${hw.title}" will be permanently deleted along with all submission records.`,
                    confirmLabel: 'Delete',
                    cancelLabel: 'Cancel',
                    confirmStyle: 'destructive',
                    onConfirmAction: 'homework/confirmDelete',
                    payload: hw.id,
                }),
            );
        },
        [dispatch],
    );

    // ─── Render ──────────────────────────────────────────────────────────────
    const renderItem: ListRenderItem<HomeworkSummary> = useCallback(
        ({ item }) => (
            <TeacherHomeworkCard
                homework={item}
                onPress={() =>
                    navigation.navigate('HomeworkDetail', { homeworkId: item.id })
                }
                onDelete={() => handleDelete(item)}
                style={styles.card}
            />
        ),
        [navigation, handleDelete],
    );

    const ListHeader = (
        <View style={styles.header}>
            {/* Status filter chips */}
            <View style={styles.filterRow}>
                {STATUS_CHIPS.map((chip) => (
                    <AppChip
                        key={chip.value}
                        label={chip.label}
                        selected={statusFilter === chip.value}
                        onPress={() => setStatusFilter(chip.value)}
                        size="sm"
                    />
                ))}
            </View>

            {/* Class filter chips */}
            {classes.length > 1 && (
                <View style={styles.filterRow}>
                    <AppChip
                        label="All Classes"
                        selected={!classFilter}
                        onPress={() => setClassFilter(undefined)}
                        size="sm"
                    />
                    {classes.map((cls) => (
                        <AppChip
                            key={cls.classId}
                            label={`${cls.name} ${cls.section}`}
                            selected={classFilter === cls.classId}
                            onPress={() => setClassFilter(cls.classId)}
                            size="sm"
                        />
                    ))}
                </View>
            )}

            <SectionHeader
                title="Homework"
                count={homework.length}
                actionLabel="+ New"
                onAction={() => navigation.navigate('HomeworkCreate', undefined)}
            />
        </View>
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={isLoading ? [] : homework}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.skeletons}>
                            {[1, 2, 3].map((i) => <SkeletonCard key={i} style={styles.card} />)}
                        </View>
                    ) : (
                        <PresetEmptyState
                            preset="homework"
                            title={statusFilter !== 'ALL' ? 'No homework found' : 'No homework yet'}
                            message={
                                statusFilter !== 'ALL'
                                    ? 'Try a different filter.'
                                    : 'Tap "+ New" to assign homework to your classes.'
                            }
                            actionLabel="+ Assign Homework"
                            onAction={() => navigation.navigate('HomeworkCreate', undefined)}
                        />
                    )
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    card: {
        marginBottom: Spacing[3],
    },
    skeletons: {
        gap: Spacing[3],
    },
});