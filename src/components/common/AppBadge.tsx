import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Colors, ANNOUNCEMENT_COLORS, REQUEST_STATUS_COLORS, PRIORITY_COLORS } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import type {
    AnnouncementType,
    AnnouncementAudience,
} from '../../types/announcement.types';
import type { RequestStatus, RequestPriority } from '../../types/request.types';

// ─── Count badge (notification bell, unread count) ────────────────────────────

interface CountBadgeProps {
    count: number;
    max?: number;       // cap display at this value, show "{max}+"
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

export function CountBadge({ count, max = 99, size = 'md', style }: CountBadgeProps) {
    if (count <= 0) return null;

    const displayCount = count > max ? `${max}+` : String(count);
    const isSmall = size === 'sm';

    return (
        <View
            style={[
                styles.countBadge,
                isSmall ? styles.countBadgeSm : styles.countBadgeMd,
                style,
            ]}
            accessibilityLabel={`${count} unread`}
        >
            <AppText
                style={[
                    styles.countText,
                    isSmall ? styles.countTextSm : styles.countTextMd,
                ]}
            >
                {displayCount}
            </AppText>
        </View>
    );
}

// ─── Dot badge (simple indicator, no count) ───────────────────────────────────

interface DotBadgeProps {
    color?: string;
    size?: number;
    style?: ViewStyle;
}

export function DotBadge({ color = Colors.error, size = 8, style }: DotBadgeProps) {
    return (
        <View
            style={[
                styles.dot,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
                style,
            ]}
        />
    );
}

// ─── Status badge (text chip — request status, attendance, etc.) ──────────────

interface StatusBadgeProps {
    label: string;
    textColor: string;
    bgColor: string;
    style?: ViewStyle;
}

export function StatusBadge({ label, textColor, bgColor, style }: StatusBadgeProps) {
    return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor }, style]}>
            <AppText
                style={[styles.statusText, { color: textColor }]}
                numberOfLines={1}
            >
                {label}
            </AppText>
        </View>
    );
}

// ─── Announcement type badge ──────────────────────────────────────────────────

interface AnnouncementBadgeProps {
    type: AnnouncementType;
    style?: ViewStyle;
}

export function AnnouncementTypeBadge({ type, style }: AnnouncementBadgeProps) {
    const config = ANNOUNCEMENT_COLORS[type];
    const labels: Record<AnnouncementType, string> = {
        GENERAL: 'General',
        CIRCULAR: 'Circular',
        HOLIDAY: 'Holiday',
        EVENT: 'Event',
        EXAM_SCHEDULE: 'Exam',
        PARENT_MEETING: 'Meeting',
        EMERGENCY: '🚨 Emergency',
    };
    return (
        <StatusBadge
            label={labels[type]}
            textColor={config.text}
            bgColor={config.bg}
            style={style}
        />
    );
}

// ─── Request status badge ─────────────────────────────────────────────────────

interface RequestStatusBadgeProps {
    status: RequestStatus;
    style?: ViewStyle;
}

export function RequestStatusBadge({ status, style }: RequestStatusBadgeProps) {
    const config = REQUEST_STATUS_COLORS[status];
    const labels: Record<RequestStatus, string> = {
        SUBMITTED: 'Submitted',
        UNDER_REVIEW: 'Under Review',
        RESPONDED: 'Responded',
        CLOSED: 'Closed',
    };
    return (
        <StatusBadge
            label={labels[status]}
            textColor={config.text}
            bgColor={config.bg}
            style={style}
        />
    );
}

// ─── Priority badge ───────────────────────────────────────────────────────────

interface PriorityBadgeProps {
    priority: RequestPriority;
    style?: ViewStyle;
}

export function PriorityBadge({ priority, style }: PriorityBadgeProps) {
    const config = PRIORITY_COLORS[priority];
    const labels: Record<RequestPriority, string> = {
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High',
        URGENT: 'Urgent',
    };
    return (
        <StatusBadge
            label={labels[priority]}
            textColor={config.text}
            bgColor={config.bg}
            style={style}
        />
    );
}

// ─── Emergency badge ──────────────────────────────────────────────────────────

export function EmergencyBadge({ style }: { style?: ViewStyle }) {
    return (
        <StatusBadge
            label="🚨 Emergency"
            textColor={Colors.badgeEmergency}
            bgColor={Colors.badgeEmergencyBg}
            style={style}
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    countBadge: {
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 18,
    },
    countBadgeMd: {
        height: 20,
        minWidth: 20,
        paddingHorizontal: Spacing[1],
    },
    countBadgeSm: {
        height: 16,
        minWidth: 16,
        paddingHorizontal: 3,
    },
    countText: {
        color: Colors.textInverse,
        fontWeight: FontWeight.bold,
    },
    countTextMd: { fontSize: FontSize.xs },
    countTextSm: { fontSize: 9 },
    dot: {
        // width/height/borderRadius set via props
    },
    statusBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
    },
});