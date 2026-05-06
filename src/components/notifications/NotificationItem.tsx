import React, { useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { DotBadge } from '../common/AppBadge';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, AvatarSize } from '../../constants/spacing';
import { formatTimeAgo } from '../../utils/date.utils';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NotificationRecord, NotificationData } from '../../types/notification.types';
import { NOTIFICATION_SCREEN_MAP } from '../../types/notification.types';

// ─── Icon map per notification category ──────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, { icon: string; bg: string; color?: string }> = {
    absence_alert: { icon: 'alert-circle', bg: '#fee2e2', color: Colors.error },
    homework_reminder: { icon: 'book', bg: '#dbeafe', color: Colors.primary },
    results_published: { icon: 'stats-chart', bg: '#dcfce7', color: Colors.success },
    attendance_threshold: { icon: 'warning', bg: '#fef3c7', color: '#b45309' },
    request_update: { icon: 'mail-unread', bg: '#f3e8ff', color: '#7e22ce' },
    announcement: { icon: 'megaphone', bg: '#e0f2fe', color: '#0369a1' },
    mark_deadline: { icon: 'create', bg: '#fef3c7', color: '#b45309' },
    emergency: { icon: 'notifications', bg: '#fef2f2', color: Colors.error },
    default: { icon: 'notifications', bg: Colors.primarySubtle, color: Colors.primary },
};

function getIconConfig(notification: NotificationRecord) {
    const data = notification.data as NotificationData | undefined;
    const screen = data?.screen ?? '';

    // Priority 1: Check for Emergency status
    if (notification.title.includes('🚨') || notification.body.includes('Emergency') || screen === 'Announcements') {
        // If it's an announcement that's an emergency, use the red icon
        return NOTIFICATION_ICONS.emergency;
    }

    if (screen.includes('Attendance')) return NOTIFICATION_ICONS.absence_alert;
    if (screen.includes('Homework')) return NOTIFICATION_ICONS.homework_reminder;
    if (screen.includes('Results')) return NOTIFICATION_ICONS.results_published;
    if (screen.includes('Request')) return NOTIFICATION_ICONS.request_update;
    if (screen.includes('Announcement')) return NOTIFICATION_ICONS.announcement;
    if (screen.includes('Mark')) return NOTIFICATION_ICONS.mark_deadline;
    return NOTIFICATION_ICONS.default;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
    notification: NotificationRecord;
    onPress?: (notification: NotificationRecord) => void;
    onMarkRead?: (id: string) => void;
    style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationItem({
    notification,
    onPress,
    onMarkRead,
    style,
}: NotificationItemProps) {
    const isUnread = notification.status === 'PENDING';
    const iconConfig = getIconConfig(notification);

    const handlePress = useCallback(() => {
        if (isUnread) onMarkRead?.(notification.id);
        onPress?.(notification);
    }, [isUnread, notification, onMarkRead, onPress]);

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={handlePress}
            style={[
                styles.container,
                isUnread && styles.containerUnread,
                style,
            ]}
            accessibilityRole="button"
            accessibilityLabel={notification.title}
            accessibilityHint="Tap to open"
            accessibilityState={{ checked: !isUnread }}
        >
            {/* Icon bubble */}
            <View style={[styles.iconBubble, { backgroundColor: iconConfig.bg }]}>
                <Icon
                    name={iconConfig.icon}
                    size={22}
                    color={iconConfig.color ?? Colors.grey700}
                />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <AppText
                        variant="subtitle2"
                        bold={isUnread}
                        style={styles.title}
                        numberOfLines={1}
                    >
                        {notification.title}
                    </AppText>
                    {isUnread && (
                        <DotBadge
                            color={Colors.primary}
                            size={8}
                            style={styles.unreadDot}
                        />
                    )}
                </View>

                <AppText
                    variant="body2"
                    secondary
                    numberOfLines={2}
                    style={styles.body}
                >
                    {notification.body}
                </AppText>

                <AppText variant="caption" tertiary style={styles.time}>
                    {formatTimeAgo(notification.createdAt)}
                </AppText>
            </View>
        </TouchableOpacity>
    );
}

// ─── Failed delivery indicator ────────────────────────────────────────────────

export function FailedNotificationItem({
    notification,
    style,
}: {
    notification: NotificationRecord;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View style={[styles.container, styles.failedContainer, style]}>
            <View style={[styles.iconBubble, { backgroundColor: Colors.errorLight }]}>
                <Icon name="flash" size={22} color={Colors.error} />
            </View>
            <View style={styles.content}>
                <AppText variant="subtitle2" numberOfLines={1} style={styles.title}>
                    {notification.title}
                </AppText>
                <AppText variant="caption" color={Colors.error}>
                    Delivery failed · {notification.failureReason ?? 'Unknown error'}
                </AppText>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ICON_SIZE = 44;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
    },
    containerUnread: {
        backgroundColor: Colors.primarySubtle,
    },
    failedContainer: {
        opacity: 0.7,
    },
    iconBubble: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        marginRight: Spacing[3],
        marginTop: Spacing[0.5],
    },
    iconEmoji: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing[0.5],
    },
    title: {
        flex: 1,
    },
    unreadDot: {
        marginLeft: Spacing[2],
        flexShrink: 0,
    },
    body: {
        lineHeight: 18,
        marginBottom: Spacing[1],
    },
    time: {
        // caption already styled
    },
});