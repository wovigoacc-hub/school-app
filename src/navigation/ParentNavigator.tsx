import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppText } from '../components/common/AppText';
import { CountBadge } from '../components/common/AppBadge';

// ── Screens ──────────────────────────────────────────────────────────────────
import { ParentHomeScreen } from '../screens/parent/home/ParentHomeScreen';
import { AttendanceCalendarScreen } from '../screens/parent/attendance/AttendanceCalendarScreen';
import { AttendanceSummaryScreen } from '../screens/parent/attendance/AttendanceSummaryScreen';
import { HomeworkFeedScreen } from '../screens/parent/homework/HomeworkFeedScreen';
import { HomeworkDetailScreen } from '../screens/parent/homework/HomeworkDetailScreen';
import { ExamListScreen } from '../screens/parent/results/ExamListScreen';
import { ExamResultScreen } from '../screens/parent/results/ExamResultScreen';
import { AnnouncementFeedScreen } from '../screens/parent/announcements/AnnouncementFeedScreen';
import { RequestListScreen } from '../screens/parent/requests/RequestListScreen';
import { RequestCreateScreen } from '../screens/parent/requests/RequestCreateScreen';
import { RequestDetailScreen } from '../screens/parent/requests/RequestDetailScreen';
import { ParentProfileScreen } from '../screens/parent/profile/ParentProfileScreen';

// ── Queries ──────────────────────────────────────────────────────────────────
import { useGetParentUnreadAnnouncementCountQuery }
    from '../services/parent/announcements.service';
import { useGetParentUnreadNotificationCountQuery }
    from '../services/parent/notifications.service';

// ── Hooks ────────────────────────────────────────────────────────────────────
import { useActiveChild } from '../hooks/useActiveChild';
import { useAuth } from '../hooks/useAuth';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight } from '../constants/typography';
import { Layout, Spacing } from '../constants/spacing';
import type {
    ParentNavigatorParamList,
    ParentTabParamList,
} from './types';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createNativeStackNavigator<ParentNavigatorParamList>();

// ─── Tab icon ─────────────────────────────────────────────────────────────────

function TabIcon({
    emoji,
    label,
    focused,
    badge,
}: {
    emoji: string;
    label: string;
    focused: boolean;
    badge?: number;
}) {
    return (
        <View style={tabStyles.wrapper}>
            <View style={tabStyles.iconBox}>
                <AppText style={tabStyles.emoji}>{emoji}</AppText>
                {badge ? (
                    <CountBadge count={badge} size="sm" style={tabStyles.badge} />
                ) : null}
            </View>
            <AppText
                style={[
                    tabStyles.label,
                    { color: focused ? Colors.parent : Colors.tabBarInactive },
                ]}
                numberOfLines={1}
            >
                {label}
            </AppText>
        </View>
    );
}

const tabStyles = StyleSheet.create({
    wrapper: { alignItems: 'center', justifyContent: 'center', gap: 2 },
    iconBox: { position: 'relative' },
    emoji: { fontSize: 22 },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
});

// ─── Placeholder for ProgressChart (add actual screen when built) ─────────────
const ProgressChartPlaceholder = () => {
    const { activeChild } = useActiveChild();
    // TODO: replace with ProgressChartScreen component
    return <ExamListScreen />;
};

// ─── Placeholder for AnnouncementDetail ──────────────────────────────────────
const AnnouncementDetailPlaceholder = () => <AnnouncementFeedScreen />;

// ─── Parent tab navigator ─────────────────────────────────────────────────────

function ParentTabs() {
    const { data: announcementCountData } =
        useGetParentUnreadAnnouncementCountQuery();
    const { data: notificationCountData } =
        useGetParentUnreadNotificationCountQuery();

    const announcementBadge = announcementCountData?.data?.unreadCount ?? 0;
    const notificationBadge = notificationCountData?.data?.unreadCount ?? 0;
    const totalBadge = announcementBadge + notificationBadge;

    const { activeChild } = useActiveChild();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: tabBarStyle,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={ParentHomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🏠" label="Home" focused={focused} badge={totalBadge} />
                    ),
                }}
            />
            <Tab.Screen
                name="AttendanceTab"
                component={AttendanceSummaryScreen}
                initialParams={{ studentId: activeChild?.studentId ?? '' }}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📅" label="Attendance" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="HomeworkTab"
                component={HomeworkFeedScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📚" label="Homework" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="ResultsTab"
                component={ExamListScreen}
                initialParams={{ studentId: activeChild?.studentId ?? '' }}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📊" label="Results" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ParentProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="👤" label="Profile" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// ─── Parent stack navigator ───────────────────────────────────────────────────

export function ParentNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.parent,
                headerTitleStyle: { color: Colors.headerText, fontWeight: FontWeight.semiBold as any },
                headerShadowVisible: false,
                headerBackTitle: 'Back',
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
            }}
        >
            {/* Root tabs */}
            <Stack.Screen
                name="ParentTabs"
                component={ParentTabs}
                options={{ headerShown: false }}
            />

            {/* Attendance */}
            <Stack.Screen
                name="AttendanceCalendar"
                component={AttendanceCalendarScreen}
                options={{ title: 'Attendance Calendar' }}
            />
            <Stack.Screen
                name="AttendanceSummary"
                component={AttendanceSummaryScreen}
                options={{ title: 'Attendance' }}
            />

            {/* Homework */}
            <Stack.Screen
                name="HomeworkFeed"
                component={HomeworkFeedScreen}
                options={{ title: 'Homework' }}
            />
            <Stack.Screen
                name="HomeworkDetail"
                component={HomeworkDetailScreen}
                options={{ title: 'Homework' }}
            />

            {/* Results */}
            <Stack.Screen
                name="ExamList"
                component={ExamListScreen}
                options={{ title: 'Exam Results' }}
            />
            <Stack.Screen
                name="ExamResult"
                component={ExamResultScreen}
                options={({ route }) => ({
                    title: (route.params as any)?.examName ?? 'Result',
                })}
            />
            <Stack.Screen
                name="ProgressChart"
                component={ProgressChartPlaceholder}
                options={{ title: 'Progress' }}
            />

            {/* Announcements */}
            <Stack.Screen
                name="Announcements"
                component={AnnouncementFeedScreen}
                options={{ title: 'Announcements' }}
            />
            <Stack.Screen
                name="AnnouncementDetail"
                component={AnnouncementDetailPlaceholder}
                options={{ title: 'Announcement' }}
            />

            {/* Requests */}
            <Stack.Screen
                name="RequestList"
                component={RequestListScreen}
                options={{ title: 'My Requests' }}
            />
            <Stack.Screen
                name="RequestCreate"
                component={RequestCreateScreen}
                options={{ title: 'New Request' }}
            />
            <Stack.Screen
                name="RequestDetail"
                component={RequestDetailScreen}
                options={{ title: 'Request' }}
            />

            {/* Notifications */}
            <Stack.Screen
                name="NotificationInbox"
                component={ParentHomeScreen}         // placeholder
                options={{ title: 'Notifications' }}
            />

            {/* Profile */}
            <Stack.Screen
                name="ParentProfile"
                component={ParentProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Stack.Navigator>
    );
}

// ─── Shared tab bar style ─────────────────────────────────────────────────────

const tabBarStyle = {
    backgroundColor: Colors.tabBarBg,
    borderTopColor: Colors.tabBarBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Layout.tabBarHeight,
    paddingBottom: Spacing[2],
    paddingTop: Spacing[2],
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
};