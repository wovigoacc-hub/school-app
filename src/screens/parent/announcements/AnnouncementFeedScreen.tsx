import React, { useState, useCallback } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import { AnnouncementCard } from '../../../components/announcements/AnnouncementCard';
import { EmergencyBannerList } from '../../../components/announcements/EmergencyBanner';
import {
    useGetParentAnnouncementFeedQuery,
    useGetParentUnreadAnnouncementCountQuery,
    useMarkParentAnnouncementsReadMutation,
} from '../../../services/parent/announcements.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { Announcement, AnnouncementType } from '../../../types/announcement.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Type filter chips ────────────────────────────────────────────────────────

type TypeFilter = 'ALL' | AnnouncementType;

const TYPE_CHIPS: Array<{ value: TypeFilter; label: string; icon?: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'CIRCULAR', label: 'Circular' },
    { value: 'EXAM_SCHEDULE', label: 'Exam' },
    { value: 'EVENT', label: 'Event' },
    { value: 'HOLIDAY', label: 'Holiday' },
    { value: 'PARENT_MEETING', label: 'Meeting' },
    { value: 'GENERAL', label: 'General' },
    { value: 'EMERGENCY', label: 'Emergency', icon: 'notifications' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AnnouncementFeedScreen() {
    const navigation = useNavigation<Nav>();

    const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
    const [unreadOnly, setUnreadOnly] = useState(false);

    const {
        data: feedData,
        isLoading,
        refetch,
    } = useGetParentAnnouncementFeedQuery({
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(unreadOnly && { unreadOnly: true }),
        limit: 30,
    });

    const { data: countData } =
        useGetParentUnreadAnnouncementCountQuery();

    const [markRead] = useMarkParentAnnouncementsReadMutation();

    const announcements = feedData?.data ?? [];
    const unreadCount = countData?.data?.unreadCount ?? 0;
    const emergencies = announcements.filter((a) => a.isEmergency && !a.isArchived);
    const nonEmergency = announcements.filter((a) => !a.isEmergency);

    const { refreshing, onRefresh } = useRefresh(refetch);

    const handlePress = useCallback(
        (a: Announcement) =>
            navigation.navigate('AnnouncementDetail', { announcementId: a.id }),
        [navigation],
    );

    const handleMarkRead = useCallback(
        (id: string) => { markRead({ announcementIds: [id] }); },
        [markRead],
    );

    const handleMarkAllRead = useCallback(() => {
        const ids = announcements.filter((a) => !a.isRead).map((a) => a.id);
        if (ids.length) markRead({ announcementIds: ids });
    }, [announcements, markRead]);

    const renderItem: ListRenderItem<Announcement> = useCallback(
        ({ item }) => (
            <AnnouncementCard
                announcement={item}
                onPress={() => handlePress(item)}
                onMarkRead={handleMarkRead}
                style={styles.card}
            />
        ),
        [handlePress, handleMarkRead],
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <FlatList
                data={isLoading ? [] : announcements}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View>
                        {/* Emergency banners */}
                        {emergencies.length > 0 && (
                            <EmergencyBannerList
                                announcements={emergencies}
                                onPress={handlePress}
                                style={styles.emergencies}
                            />
                        )}

                        <View style={styles.headerPad}>
                            <SectionHeader
                                title="Announcements"
                                count={unreadCount > 0 ? unreadCount : undefined}
                                actionLabel={unreadCount > 0 ? 'Mark all read' : undefined}
                                onAction={unreadCount > 0 ? handleMarkAllRead : undefined}
                            />

                            {/* Unread toggle + type filters */}
                            <View style={styles.filterRow}>
                                <AppChip
                                    label={unreadOnly ? '● Unread only' : 'Unread only'}
                                    selected={unreadOnly}
                                    onPress={() => setUnreadOnly((p) => !p)}
                                    size="sm"
                                />
                            </View>

                            <View style={styles.typeChips}>
                                {TYPE_CHIPS.map((chip) => (
                                    <AppChip
                                        key={chip.value}
                                        label={chip.label}
                                        selected={typeFilter === chip.value}
                                        onPress={() => setTypeFilter(chip.value)}
                                        size="sm"
                                        leftIcon={chip.icon ? (
                                            <Ionicons
                                                name={chip.icon}
                                                size={12}
                                                color={typeFilter === chip.value ? Colors.primary : Colors.error}
                                            />
                                        ) : undefined}
                                    />
                                ))}
                            </View>
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
                            preset="announcements"
                            title={
                                unreadOnly ? 'All caught up!' :
                                    typeFilter !== 'ALL' ? 'No announcements of this type' :
                                        'No announcements yet'
                            }
                            message={
                                unreadOnly
                                    ? 'You have no unread announcements.'
                                    : 'School announcements will appear here.'
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
        paddingBottom: Spacing[10],
    },
    emergencies: {
        marginBottom: Spacing[2],
    },
    headerPad: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[4],
        gap: Spacing[3],
    },
    filterRow: {
        flexDirection: 'row',
    },
    typeChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    card: {
        marginHorizontal: Layout.screenPaddingH,
        marginBottom: Spacing[3],
    },
    skeletons: {
        paddingHorizontal: Layout.screenPaddingH,
        gap: Spacing[3],
    },
});