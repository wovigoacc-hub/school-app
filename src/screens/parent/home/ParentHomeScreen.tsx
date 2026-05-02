import React, { useCallback, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { SkeletonCard } from '../../../components/common/AppSkeleton';
import { ChildSwitcher } from '../../../components/child/ChildSwitcher';
import { ChildSummaryCard } from '../../../components/child/ChildSummaryCard';
import { EmergencyBannerList } from '../../../components/announcements/EmergencyBanner';
import { AnnouncementCard } from '../../../components/announcements/AnnouncementCard';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { useAuth } from '../../../hooks/useAuth';
import { useActiveChild } from '../../../hooks/useActiveChild';
import { useAppDispatch } from '../../../app/store';
import {
    useGetChildTodayAttendanceQuery,
} from '../../../services/parent/attendance.service';
import {
    useGetChildHomeworkFeedQuery,
} from '../../../services/parent/homework.service';
import {
    useGetParentAnnouncementFeedQuery,
    useMarkParentAnnouncementsReadMutation,
} from '../../../services/parent/announcements.service';
import { Colors } from '../../../constants/colors';
import { Layout, Spacing } from '../../../constants/spacing';
import type { LinkedChild } from '../../../types/parent.types';
import type { Announcement } from '../../../types/announcement.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ParentHomeScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();
    const { displayName } = useAuth();
    const {
        activeChild,
        activeChildId,
        children,
        hasMultiple,
        switchChild,
    } = useActiveChild();

    // ─── Queries for active child ────────────────────────────────────────────
    const {
        data: todayData,
        refetch: refetchToday,
        isLoading: todayLoading,
    } = useGetChildTodayAttendanceQuery(activeChildId ?? '', {
        skip: !activeChildId,
        pollingInterval: 300000, // 5 mins
    });

    const {
        data: homeworkData,
        refetch: refetchHomework,
        isLoading: hwLoading,
    } = useGetChildHomeworkFeedQuery(
        { studentId: activeChildId ?? '', params: { pendingOnly: true, limit: 5 } },
        { skip: !activeChildId },
    );

    const {
        data: announcementData,
        refetch: refetchAnnouncements,
        isLoading: announcementsLoading,
    } = useGetParentAnnouncementFeedQuery({ limit: 5 }, { skip: !activeChildId });

    const [markRead] = useMarkParentAnnouncementsReadMutation();

    const todayAttendance = todayData?.data;
    const pendingHomework = homeworkData?.data ?? [];
    const announcements = announcementData?.data ?? [];
    const emergencies = announcements.filter((a) => a.isEmergency && !a.isArchived);
    const nonEmergency = announcements.filter((a) => !a.isEmergency);
    const unreadCount = announcements.filter((a) => !a.isRead).length;

    const refetchAll = useCallback(async () => {
        await Promise.all([
            refetchToday(),
            refetchHomework(),
            refetchAnnouncements(),
        ]);
    }, [refetchToday, refetchHomework, refetchAnnouncements]);

    const { refreshing, onRefresh } = useRefresh(refetchAll);

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleChildSwitch = useCallback(
        (child: LinkedChild) => {
            // RTK Query will re-fetch with new studentId automatically via skip
        },
        [],
    );

    const handleMarkRead = useCallback(
        (id: string) => markRead({ announcementIds: [id] }),
        [markRead],
    );

    const handleAnnouncementPress = useCallback(
        (announcement: Announcement) => {
            navigation.navigate('AnnouncementDetail', {
                announcementId: announcement.id,
            });
        },
        [navigation],
    );

    const isLoading = todayLoading || hwLoading || announcementsLoading;

    if (!activeChild) {
        return (
            <ScreenWrapper statusBar="parent">
                <PresetEmptyState
                    preset="search"
                    icon="👨‍👩‍👧"
                    title="No children linked"
                    message="Your children's information will appear here once linked by the school admin."
                />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="parent">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Emergency banners */}
                {emergencies.length > 0 && (
                    <EmergencyBannerList
                        announcements={emergencies}
                        onPress={handleAnnouncementPress}
                        style={styles.emergencies}
                    />
                )}

                {/* ── Greeting ─────────────────────────────────────────────────── */}
                <View style={styles.greeting}>
                    <AppText variant="h3">
                        Good {getGreeting()}! 👋
                    </AppText>
                    <AppText variant="body1" secondary numberOfLines={1}>
                        {displayName}
                    </AppText>
                </View>

                {/* ── Child switcher (multiple children only) ───────────────── */}
                {hasMultiple && (
                    <View style={styles.switcherWrapper}>
                        <ChildSwitcher
                            onSwitch={handleChildSwitch}
                            showClass
                        />
                    </View>
                )}

                {/* ── Child summary card ────────────────────────────────────── */}
                <View style={styles.summaryPad}>
                    {isLoading ? (
                        <SkeletonCard lines={4} />
                    ) : (
                        <ChildSummaryCard
                            child={activeChild}
                            todayAttendance={todayAttendance}
                            pendingHomework={pendingHomework.length}
                            unreadAnnouncements={unreadCount}
                            onAttendancePress={() =>
                                navigation.navigate('AttendanceCalendar', {
                                    studentId: activeChild.studentId,
                                })
                            }
                            onHomeworkPress={() =>
                                navigation.navigate('HomeworkFeed', {
                                    studentId: activeChild.studentId,
                                })
                            }
                            onResultsPress={() =>
                                navigation.navigate('ExamList', {
                                    studentId: activeChild.studentId,
                                })
                            }
                        />
                    )}
                </View>

                {/* ── Recent announcements ─────────────────────────────────── */}
                <View style={styles.section}>
                    <SectionHeader
                        title="Announcements"
                        count={unreadCount > 0 ? unreadCount : undefined}
                        actionLabel="See all"
                        onAction={() => navigation.navigate('Announcements')}
                    />

                    {announcementsLoading ? (
                        <>
                            <SkeletonCard style={styles.announcementCard} />
                            <SkeletonCard style={styles.announcementCard} />
                        </>
                    ) : nonEmergency.length === 0 ? (
                        <PresetEmptyState
                            preset="announcements"
                            compact
                        />
                    ) : (
                        nonEmergency.slice(0, 3).map((a) => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                onPress={() => handleAnnouncementPress(a)}
                                onMarkRead={handleMarkRead}
                                expandable
                                style={styles.announcementCard}
                            />
                        ))
                    )}
                </View>

                <Spacer size={Spacing[10]} />
            </ScrollView>
        </ScreenWrapper>
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
    scroll: {
        paddingBottom: Spacing[10],
    },
    emergencies: {
        marginBottom: Spacing[2],
    },
    greeting: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[5],
        paddingBottom: Spacing[3],
        gap: Spacing[1],
    },
    switcherWrapper: {
        marginBottom: Spacing[2],
    },
    summaryPad: {
        paddingHorizontal: Layout.screenPaddingH,
        marginBottom: Spacing[2],
    },
    section: {
        paddingHorizontal: Layout.screenPaddingH,
        marginTop: Spacing[4],
    },
    announcementCard: {
        marginBottom: Spacing[3],
    },
});