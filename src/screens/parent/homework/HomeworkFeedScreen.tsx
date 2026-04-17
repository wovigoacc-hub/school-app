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
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { ParentHomeworkCard } from '../../../components/homework/HomeworkCard';
import { useActiveChild } from '../../../hooks/useActiveChild';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetChildHomeworkFeedQuery,
    useReportHomeworkSubmissionMutation,
} from '../../../services/parent/homework.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { ParentHomeworkItem } from '../../../types/homework.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeworkFeedScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();
    const { activeChild } = useActiveChild();

    const studentId = activeChild?.studentId ?? '';

    const [pendingOnly, setPendingOnly] = useState(false);

    const {
        data,
        isLoading,
        refetch,
    } = useGetChildHomeworkFeedQuery(
        {
            studentId,
            params: { pendingOnly, limit: 30 },
        },
        { skip: !studentId },
    );

    const [reportSubmission, { isLoading: isReporting }] =
        useReportHomeworkSubmissionMutation();

    const homework = data?.data ?? [];
    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Mark done ───────────────────────────────────────────────────────────
    const handleMarkDone = useCallback(
        async (homeworkId: string) => {
            if (!studentId) return;
            try {
                await reportSubmission({ studentId, homeworkId }).unwrap();
                dispatch(showSuccessToast('Marked as submitted'));
            } catch {
                dispatch(showErrorToast('Could not update. Please try again.'));
            }
        },
        [studentId, reportSubmission, dispatch],
    );

    // ─── Render ──────────────────────────────────────────────────────────────
    const renderItem: ListRenderItem<ParentHomeworkItem> = useCallback(
        ({ item }) => (
            <ParentHomeworkCard
                homework={item}
                onPress={() =>
                    navigation.navigate('HomeworkDetail', {
                        homeworkId: item.id,
                        studentId,
                    })
                }
                onMarkDone={
                    item.myStatus === 'PENDING' && !item.isOverdue
                        ? () => handleMarkDone(item.id)
                        : undefined
                }
                style={styles.card}
            />
        ),
        [navigation, studentId, handleMarkDone],
    );

    if (!activeChild) {
        return (
            <ScreenWrapper statusBar="parent">
                <PresetEmptyState
                    preset="homework"
                    title="No child selected"
                    message="Select a child to view their homework."
                    compact
                />
            </ScreenWrapper>
        );
    }

    const pendingCount = homework.filter((h) => h.myStatus === 'PENDING').length;

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <FlatList
                data={isLoading ? [] : homework}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        {/* Child context */}
                        <View style={styles.childContext}>
                            <AppText variant="h4" numberOfLines={1}>
                                {activeChild.firstName}'s Homework
                            </AppText>
                            <AppText variant="body2" secondary>
                                {activeChild.className} {activeChild.section}
                            </AppText>
                        </View>

                        {/* Filter row */}
                        <View style={styles.filterRow}>
                            <AppChip
                                label="All"
                                selected={!pendingOnly}
                                onPress={() => setPendingOnly(false)}
                                size="sm"
                            />
                            <AppChip
                                label={
                                    pendingCount > 0
                                        ? `Pending (${pendingCount})`
                                        : 'Pending'
                                }
                                selected={pendingOnly}
                                onPress={() => setPendingOnly(true)}
                                size="sm"
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.skeletons}>
                            {[1, 2, 3].map((i) => (
                                <SkeletonCard key={i} lines={3} style={styles.card} />
                            ))}
                        </View>
                    ) : (
                        <PresetEmptyState
                            preset="homework"
                            title={pendingOnly ? 'All homework done! 🎉' : 'No homework yet'}
                            message={
                                pendingOnly
                                    ? 'No pending homework for this child.'
                                    : 'Homework assigned to your child will appear here.'
                            }
                            compact
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
        marginBottom: Spacing[2],
    },
    childContext: {
        gap: Spacing[1],
    },
    filterRow: {
        flexDirection: 'row',
        gap: Spacing[2],
    },
    card: {
        marginBottom: Spacing[3],
    },
    skeletons: {
        gap: Spacing[3],
    },
});