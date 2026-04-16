import React, { useState, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppCard } from '../common/AppCard';
import { DotBadge } from '../common/AppBadge';
import { AnnouncementTypeBadge } from '../common/AppBadge';
import { Colors, ANNOUNCEMENT_COLORS } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatRelative } from '../../utils/date.utils';
import { truncate } from '../../utils/format.utils';
import type { Announcement } from '../../types/announcement.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AnnouncementCardProps {
    announcement: Announcement;
    onPress?: () => void;
    onMarkRead?: (id: string) => void;
    /** Expand body inline (no navigation) */
    expandable?: boolean;
    style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnouncementCard({
    announcement,
    onPress,
    onMarkRead,
    expandable = false,
    style,
}: AnnouncementCardProps) {
    const [expanded, setExpanded] = useState(false);

    const {
        id,
        title,
        body,
        type,
        isEmergency,
        isRead,
        publishedAt,
        authorName,
        targetClasses,
        audience,
    } = announcement;

    const isUnread = !isRead;

    const handlePress = useCallback(() => {
        if (isUnread) onMarkRead?.(id);
        if (expandable) {
            setExpanded((prev) => !prev);
        } else {
            onPress?.();
        }
    }, [isUnread, id, onMarkRead, expandable, onPress]);

    // Emergency cards get a distinct red left border
    const emergencyStyle: ViewStyle = isEmergency
        ? { borderLeftWidth: 4, borderLeftColor: Colors.error }
        : {};

    const cardBg = isEmergency
        ? '#fff5f5'
        : isUnread
            ? Colors.primarySubtle
            : Colors.surface;

    return (
        <AppCard
            style={[styles.card, emergencyStyle, { backgroundColor: cardBg }, style]}
            onPress={handlePress}
            noPadding
            flat={isEmergency}
            accessibilityLabel={title}
            accessibilityHint={isUnread ? 'Unread announcement' : undefined}
        >
            <View style={styles.inner}>

                {/* Top row: type badge + time + unread dot */}
                <View style={styles.topRow}>
                    <AnnouncementTypeBadge type={type} />
                    <View style={styles.topRight}>
                        <AppText variant="caption" tertiary>
                            {formatRelative(publishedAt)}
                        </AppText>
                        {isUnread && (
                            <DotBadge
                                color={isEmergency ? Colors.error : Colors.primary}
                                size={8}
                                style={styles.unreadDot}
                            />
                        )}
                    </View>
                </View>

                {/* Title */}
                <AppText
                    variant="subtitle1"
                    bold={isUnread}
                    style={[styles.title, isEmergency && styles.titleEmergency]}
                    numberOfLines={expanded ? undefined : 2}
                >
                    {isEmergency ? '🚨 ' : ''}{title}
                </AppText>

                {/* Body preview or full */}
                <AppText
                    variant="body2"
                    secondary
                    style={styles.body}
                    numberOfLines={expanded ? undefined : 3}
                >
                    {body}
                </AppText>

                {/* Expand toggle */}
                {expandable && body.length > 120 && (
                    <TouchableOpacity
                        onPress={() => setExpanded((p) => !p)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={expanded ? 'Show less' : 'Read more'}
                    >
                        <AppText variant="label" color={Colors.primary} style={styles.toggle}>
                            {expanded ? 'Show less' : 'Read more'}
                        </AppText>
                    </TouchableOpacity>
                )}

                {/* Footer: author + audience */}
                <View style={styles.footer}>
                    <AppText variant="caption" tertiary numberOfLines={1} style={styles.footerText}>
                        {authorName}
                        {targetClasses.length > 0
                            ? ` · ${targetClasses.slice(0, 2).join(', ')}${targetClasses.length > 2 ? ` +${targetClasses.length - 2}` : ''}`
                            : audience === 'ALL'
                                ? ' · Everyone'
                                : audience === 'PARENTS'
                                    ? ' · Parents'
                                    : audience === 'TEACHERS'
                                        ? ' · Teachers'
                                        : ''}
                    </AppText>
                </View>
            </View>
        </AppCard>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    inner: {
        padding: Spacing[4],
        gap: Spacing[2],
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unreadDot: {
        marginLeft: Spacing[2],
    },
    title: {
        lineHeight: 22,
    },
    titleEmergency: {
        color: Colors.error,
    },
    body: {
        lineHeight: 20,
    },
    toggle: {
        marginTop: Spacing[1],
    },
    footer: {
        marginTop: Spacing[1],
    },
    footerText: {
        // caption already handles size/color
    },
});