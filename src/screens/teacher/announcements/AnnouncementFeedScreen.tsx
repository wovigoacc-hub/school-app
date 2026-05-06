import React, { useState, useCallback, useEffect } from 'react';
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
    useGetTeacherAnnouncementFeedQuery,
    useGetTeacherUnreadAnnouncementCountQuery,
    useMarkTeacherAnnouncementsReadMutation,
} from '../../../services/teacher/announcements.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { Announcement, AnnouncementType } from '../../../types/announcement.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Type filter chips ────────────────────────────────────────────────────────

type TypeFilter = 'ALL' | AnnouncementType;

const TYPE_CHIPS: Array<{ value: TypeFilter; label: string; icon?: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'GENERAL', label: 'General' },
    { value: 'CIRCULAR', label: 'Circular' },
    { value: 'EXAM_SCHEDULE', label: 'Exam' },
    { value: 'EVENT', label: 'Event' },
    { value: 'HOLIDAY', label: 'Holiday' },
    { value: 'PARENT_MEETING', label: 'Meeting' },
    { value: 'EMERGENCY', label: 'Emergency', icon: 'notifications' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AnnouncementFeedScreen() {
    const navigation = useNavigation<Nav>();

    const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
    const [unreadOnly, setUnreadOnly] = useState(false);

    // ─── Queries ──────────────────────────────────────────────────────────────
    const {
        data: feedData,
        isLoading,
        refetch,
        isFetching,
    } = useGetTeacherAnnouncementFeedQuery({
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(unreadOnly && { unreadOnly: true }),
        limit: 30,
    });

    const { data: countData } = useGetTeacherUnreadAnnouncementCountQuery();
    const [markRead] = useMarkTeacherAnnouncementsReadMutation();

    const announcements = feedData?.data ?? [];
    const unreadCount = countData?.data?.unreadCount ?? 0;
    const emergencies = announcements.filter((a) => a.isEmergency && !a.isArchived);

    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Mark as read on press ────────────────────────────────────────────────
    const handlePress = useCallback(
        (announcement: Announcement) => {
            navigation.navigate('AnnouncementDetail', {
                announcementId: announcement.id,
            });
        },
        [navigation],
    );

    const handleMarkRead = useCallback(
        (id: string) => {
            markRead({ announcementIds: [id] });
        },
        [markRead],
    );

    // Mark all visible as read when navigating away (batch)
    const handleMarkAllVisible = useCallback(() => {
        const unreadIds = announcements
            .filter((a) => !a.isRead)
            .map((a) => a.id);
        if (unreadIds.length) {
            markRead({ announcementIds: unreadIds });
        }
    }, [announcements, markRead]);

    // ─── Render ───────────────────────────────────────────────────────────────

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

    const ListHeader = (
        <View>
            {/* Emergency banners pinned at top */}
            {emergencies.length > 0 && (
                <EmergencyBannerList
                    announcements={emergencies}
                    onPress={handlePress}
                    style={styles.emergencyList}
                />
            )}

            <View style={styles.headerPad}>
                {/* Title + unread count + mark all read */}
                <SectionHeader
                    title="Announcements"
                    count={unreadCount > 0 ? unreadCount : undefined}
                    actionLabel={unreadCount > 0 ? 'Mark all read' : undefined}
                    onAction={unreadCount > 0 ? handleMarkAllVisible : undefined}
                />

                {/* Unread toggle chip */}
                <View style={styles.filterRow}>
                    <AppChip
                        label={unreadOnly ? '● Unread only' : 'Unread only'}
                        selected={unreadOnly}
                        onPress={() => setUnreadOnly((p) => !p)}
                        size="sm"
                    />
                </View>

                {/* Type filter chips */}
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
    );

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={isLoading ? [] : announcements}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
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

            {/* FAB — create announcement */}
            <View
                style={styles.fab}
                pointerEvents="box-none"
            >
                <AppChip
                    label="＋ New Announcement"
                    selected
                    onPress={() => navigation.navigate('AnnouncementCreate')}
                    style={styles.fabChip}
                    labelStyle={{ color: Colors.white }}
                />
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: Spacing[10] + 60, // clear FAB
    },
    emergencyList: {
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
    fab: {
        position: 'absolute',
        bottom: Spacing[6],
        right: Layout.screenPaddingH,
        alignSelf: 'flex-end',
    },
    fabChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
    },
});