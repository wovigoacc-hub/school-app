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
import { RequestCard } from '../../../components/requests/RequestCard';
import { useGetTeacherRequestsQuery } from '../../../services/teacher/requests.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { ParentRequestSummary, RequestStatus } from '../../../types/request.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Status filter ────────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | RequestStatus;

const FILTER_CHIPS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'SUBMITTED', label: 'New' },
    { value: 'UNDER_REVIEW', label: 'In Review' },
    { value: 'RESPONDED', label: 'Responded' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RequestListScreen() {
    const navigation = useNavigation<Nav>();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const {
        data,
        isLoading,
        refetch,
        isFetching,
    } = useGetTeacherRequestsQuery({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        limit: 20,
    });

    const requests = data?.data ?? [];
    const total = data?.meta?.total ?? 0;
    const { refreshing, onRefresh } = useRefresh(refetch);

    const handlePress = useCallback(
        (request: ParentRequestSummary) => {
            navigation.navigate('RequestDetail', { requestId: request.id });
        },
        [navigation],
    );

    const renderItem: ListRenderItem<ParentRequestSummary> = useCallback(
        ({ item }) => (
            <RequestCard
                request={item}
                onPress={() => handlePress(item)}
                showParent
                style={styles.card}
            />
        ),
        [handlePress],
    );

    const ListHeader = (
        <View style={styles.header}>
            <SectionHeader
                title="Assigned Requests"
                count={total}
            />
            {/* Status filter chips */}
            <View style={styles.filterRow}>
                {FILTER_CHIPS.map((chip) => (
                    <AppChip
                        key={chip.value}
                        label={chip.label}
                        selected={statusFilter === chip.value}
                        onPress={() => setStatusFilter(chip.value)}
                        size="sm"
                    />
                ))}
            </View>
        </View>
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={isLoading ? [] : requests}
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
                            preset="requests"
                            title={statusFilter !== 'ALL' ? 'No requests with this status' : 'No requests assigned'}
                            message={
                                statusFilter !== 'ALL'
                                    ? 'Try a different filter.'
                                    : 'Parent requests assigned to you by the school admin will appear here.'
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