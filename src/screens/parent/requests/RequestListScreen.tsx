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
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { RequestCard } from '../../../components/requests/RequestCard';
import { useActiveChild } from '../../../hooks/useActiveChild';
import { useGetParentRequestsQuery } from '../../../services/parent/requests.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { ParentRequestSummary, RequestStatus } from '../../../types/request.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Filter chips ─────────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'OPEN' | RequestStatus;

const FILTER_CHIPS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'In Review' },
    { value: 'RESPONDED', label: 'Responded' },
    { value: 'CLOSED', label: 'Closed' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RequestListScreen() {
    const navigation = useNavigation<Nav>();
    const { activeChild } = useActiveChild();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    // OPEN = SUBMITTED + UNDER_REVIEW combined; send as two separate queries or
    // filter client-side from an ALL fetch.
    const {
        data,
        isLoading,
        refetch,
    } = useGetParentRequestsQuery({
        ...(statusFilter !== 'ALL' && statusFilter !== 'OPEN' && {
            status: statusFilter,
        }),
        limit: 30,
    });

    const allRequests = data?.data ?? [];
    const total = data?.meta?.total ?? 0;

    // Client-side filter for OPEN (combined SUBMITTED + UNDER_REVIEW)
    const requests = statusFilter === 'OPEN'
        ? allRequests.filter(
            (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
        )
        : allRequests;

    const openCount = allRequests.filter(
        (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
    ).length;

    const { refreshing, onRefresh } = useRefresh(refetch);

    const renderItem: ListRenderItem<ParentRequestSummary> = useCallback(
        ({ item }) => (
            <RequestCard
                request={item}
                onPress={() =>
                    navigation.navigate('RequestDetail', { requestId: item.id })
                }
                style={styles.card}
            />
        ),
        [navigation],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <FlatList
                data={isLoading ? [] : requests}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.titleBlock}>
                                <SectionHeader
                                    title="My Requests"
                                    count={total}
                                    compact
                                />
                                {openCount > 0 && (
                                    <AppText variant="caption" secondary>
                                        {openCount} open
                                    </AppText>
                                )}
                            </View>
                            <AppButton
                                label="+ New"
                                variant="primary"
                                size="sm"
                                onPress={() =>
                                    navigation.navigate('RequestCreate', {
                                        studentId: activeChild?.studentId,
                                    })
                                }
                            />
                        </View>

                        {/* Filter chips */}
                        <View style={styles.filterRow}>
                            {FILTER_CHIPS.map((chip) => (
                                <AppChip
                                    key={chip.value}
                                    label={
                                        chip.value === 'OPEN' && openCount > 0
                                            ? `Open (${openCount})`
                                            : chip.label
                                    }
                                    selected={statusFilter === chip.value}
                                    onPress={() => setStatusFilter(chip.value)}
                                    size="sm"
                                />
                            ))}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.skeletons}>
                            {[1, 2].map((i) => (
                                <SkeletonCard key={i} lines={4} style={styles.card} />
                            ))}
                        </View>
                    ) : (
                        <PresetEmptyState
                            preset="requests"
                            title={
                                statusFilter !== 'ALL'
                                    ? 'No requests with this status'
                                    : 'No requests yet'
                            }
                            message={
                                statusFilter !== 'ALL'
                                    ? 'Try a different filter.'
                                    : 'Raise a request to communicate with the school.'
                            }
                            actionLabel="+ Raise a Request"
                            onAction={() =>
                                navigation.navigate('RequestCreate', {
                                    studentId: activeChild?.studentId,
                                })
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    titleBlock: {
        gap: 2,
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