import React from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { AppText } from '../../../components/common/AppText';
import { NotificationItem } from '../../../components/notifications/NotificationItem';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import {
    useGetTeacherNotificationInboxQuery,
    useMarkTeacherNotificationsDeliveredMutation
} from '../../../services/parent/notifications.service';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Divider } from '../../../components/layout/Divider';

export function NotificationInboxScreen() {
    const { data, isLoading, refetch } = useGetTeacherNotificationInboxQuery({});
    const [markRead] = useMarkTeacherNotificationsDeliveredMutation();

    const { refreshing, onRefresh } = useRefresh(refetch);
    const notifications = data?.data ?? [];

    const handleMarkRead = (id: string) => {
        markRead({ notificationIds: [id] });
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={Colors.teacher} size="large" />
            </View>
        );
    }

    return (
        <ScreenWrapper scrollable={false} noPadding statusBar="teacher">
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onMarkRead={handleMarkRead}
                    />
                )}
                ItemSeparatorComponent={() => <Divider />}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <AppText secondary>No notifications yet</AppText>
                    </View>
                }
                contentContainerStyle={styles.list}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingBottom: Spacing[10] },
    empty: { padding: Spacing[10], alignItems: 'center' },
});
