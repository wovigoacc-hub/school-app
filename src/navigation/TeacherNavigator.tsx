import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppText } from '../components/common/AppText';
import { CountBadge } from '../components/common/AppBadge';
import { AppStatusBar } from '../components/common/AppStatusBar';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Screens ──────────────────────────────────────────────────────────────────
import { TeacherHomeScreen } from '../screens/teacher/home/TeacherHomeScreen';
import { AttendanceClassPickerScreen } from '../screens/teacher/attendance/AttendanceClassPickerScreen';
import { AttendanceMarkScreen } from '../screens/teacher/attendance/AttendanceMarkScreen';
import { AttendanceHistoryScreen } from '../screens/teacher/attendance/AttendanceHistoryScreen';
import { HomeworkListScreen } from '../screens/teacher/homework/HomeworkListScreen';
import { HomeworkDetailScreen } from '../screens/teacher/homework/HomeworkDetailScreen';
import { HomeworkCreateScreen } from '../screens/teacher/homework/HomeworkCreateScreen';
import { HomeworkSubmissionsScreen } from '../screens/teacher/homework/HomeworkSubmissionsScreen';
import { ExamListScreen } from '../screens/teacher/marks/ExamListScreen';
import { MarkSheetScreen } from '../screens/teacher/marks/MarkSheetScreen';
import { MarkEntryScreen } from '../screens/teacher/marks/MarkEntryScreen';
import { AnnouncementFeedScreen } from '../screens/teacher/announcements/AnnouncementFeedScreen';
import { AnnouncementDetailScreen } from '../screens/common/announcements/AnnouncementDetailScreen';
import { AnnouncementCreateScreen } from '../screens/teacher/announcements/AnnouncementCreateScreen';
import { RequestListScreen } from '../screens/teacher/requests/RequestListScreen';
import { RequestDetailScreen } from '../screens/teacher/requests/RequestDetailScreen';
import { TeacherProfileScreen } from '../screens/teacher/profile/TeacherProfileScreen';
import { UpdatePasswordScreen } from '../screens/teacher/profile/UpdatePasswordScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { NotificationInboxScreen } from '../screens/teacher/notifications/NotificationInboxScreen';
// ── Queries (for tab badges) ─────────────────────────────────────────────────
import { useGetTeacherUnreadAnnouncementCountQuery }
    from '../services/teacher/announcements.service';
import { useGetTeacherUnreadNotificationCountQuery }
    from '../services/parent/notifications.service';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight } from '../constants/typography';
import { Layout, Spacing } from '../constants/spacing';
import type {
    TeacherNavigatorParamList,
    TeacherTabParamList,
} from './types';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const Stack = createNativeStackNavigator<TeacherNavigatorParamList>();

// ─── Tab icon helper ──────────────────────────────────────────────────────────

function TabIcon({
    icon,
    label,
    focused,
    badge,
}: {
    icon: string;
    label: string;
    focused: boolean;
    badge?: number;
}) {
    return (
        <View style={tabStyles.wrapper}>
            <View style={tabStyles.iconBox}>
                <Icon
                    name={focused ? icon : `${icon}-outline`}
                    size={22}
                    color={focused ? Colors.teacher : Colors.grey600}
                />
                {badge ? (
                    <CountBadge count={badge} size="sm" style={tabStyles.badge} />
                ) : null}
            </View>
            <AppText
                variant="caption"
                style={[
                    tabStyles.label,
                    { color: focused ? Colors.teacher : Colors.grey600 },
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
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
    },
    label: {
        fontSize: 10,
        fontWeight: FontWeight.semiBold,
        lineHeight: 12,
        marginTop: 2,
    },
});

// ─── Teacher tab navigator ────────────────────────────────────────────────────

function TeacherTabs() {
    const { data: announcementCountData } =
        useGetTeacherUnreadAnnouncementCountQuery();
    const announcementBadge =
        announcementCountData?.data?.unreadCount ?? 0;

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
                component={TeacherHomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="home" label="Home" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="AttendanceTab"
                component={AttendanceClassPickerScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="clipboard" label="Attendance" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="HomeworkTab"
                component={HomeworkListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="book" label="Homework" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="MarksTab"
                component={ExamListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="create" label="Marks" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={TeacherProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            icon="person"
                            label="Profile"
                            focused={focused}
                            badge={announcementBadge}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// ─── Teacher stack navigator ──────────────────────────────────────────────────

export function TeacherNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.teacher,
                headerTitleStyle: { color: Colors.headerText, fontWeight: FontWeight.semiBold as any },
                headerShadowVisible: false,
                headerBackTitle: 'Back',
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
            }}
        >
            {/* Root tabs — no header */}
            <Stack.Screen
                name="TeacherTabs"
                component={TeacherTabs}
                options={{ headerShown: false }}
            />

            {/* Attendance */}
            <Stack.Screen
                name="AttendanceClassPicker"
                component={AttendanceClassPickerScreen}
                options={{ title: 'Mark Attendance' }}
            />
            <Stack.Screen
                name="AttendanceMark"
                component={AttendanceMarkScreen}
                options={{ title: 'Attendance' }}
            />
            <Stack.Screen
                name="AttendanceHistory"
                component={AttendanceHistoryScreen}
                options={{ title: 'Attendance History' }}
            />

            {/* Homework */}
            <Stack.Screen
                name="HomeworkList"
                component={HomeworkListScreen}
                options={{ title: 'Homework' }}
            />
            <Stack.Screen
                name="HomeworkDetail"
                component={HomeworkDetailScreen}
                options={{ title: 'Homework Detail' }}
            />
            <Stack.Screen
                name="HomeworkCreate"
                component={HomeworkCreateScreen}
                options={{ title: 'Assign Homework' }}
            />
            <Stack.Screen
                name="HomeworkEdit"
                component={HomeworkCreateScreen}   // reuse create for edit
                options={{ title: 'Edit Homework' }}
            />
            <Stack.Screen
                name="HomeworkSubmissions"
                component={HomeworkSubmissionsScreen}
                options={({ route }) => ({ title: (route.params as any)?.title ?? 'Submissions' })}
            />

            {/* Marks */}
            <Stack.Screen
                name="ExamList"
                component={ExamListScreen}
                options={{ title: 'Mark Entry' }}
            />
            <Stack.Screen
                name="MarkSheet"
                component={MarkSheetScreen}
                options={({ route }) => ({
                    title: (route.params as any)?.subjectName ?? 'Mark Sheet',
                })}
            />
            <Stack.Screen
                name="MarkEntry"
                component={MarkEntryScreen}
                options={({ route }) => ({
                    title: (route.params as any)?.subjectName ?? 'Enter Marks',
                })}
            />
            <Stack.Screen
                name="Marks"
                component={ExamListScreen}
                options={{ title: 'Mark Entry' }}
            />

            {/* Announcements */}
            <Stack.Screen
                name="Announcements"
                component={AnnouncementFeedScreen}
                options={{ title: 'Announcements' }}
            />
            <Stack.Screen
                name="AnnouncementDetail"
                component={AnnouncementDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AnnouncementCreate"
                component={AnnouncementCreateScreen}
                options={{ title: 'New Announcement' }}
            />

            {/* Requests */}
            <Stack.Screen
                name="RequestList"
                component={RequestListScreen}
                options={{ title: 'Requests' }}
            />
            <Stack.Screen
                name="RequestDetail"
                component={RequestDetailScreen}
                options={{ title: 'Request Detail' }}
            />

            {/* Notifications */}
            <Stack.Screen
                name="NotificationInbox"
                component={NotificationInboxScreen}
                options={{ title: 'Notifications' }}
            />

            {/* Profile */}
            <Stack.Screen
                name="TeacherProfile"
                component={TeacherProfileScreen}
                options={{ title: 'Profile' }}
            />
            <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{ title: 'Change Password' }}
            />
            <Stack.Screen
                name="UpdatePassword"
                component={UpdatePasswordScreen}
                options={{ title: 'Change Password' }}
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