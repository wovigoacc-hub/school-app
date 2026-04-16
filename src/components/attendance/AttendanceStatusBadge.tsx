import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import {
    ATTENDANCE_COLOURS,
    ATTENDANCE_BG_COLOURS,
    ATTENDANCE_LABELS,
    TODAY_STATUS_COLOURS,
    TODAY_STATUS_LABELS,
} from '../../utils/attendance.utils';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Colors } from '../../constants/colors';
import type {
    AttendanceStatus,
    TodayAttendanceStatus,
} from '../../types/attendance.types';

// ─── Status icons ──────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<AttendanceStatus, string> = {
    PRESENT: '✓',
    ABSENT: '✗',
    LATE: '◷',
    LEAVE: '◈',
    HALF_DAY: '◑',
};

// ─── AttendanceStatusBadge ────────────────────────────────────────────────────

interface AttendanceStatusBadgeProps {
    status: AttendanceStatus;
    /** Show icon alongside label */
    showIcon?: boolean;
    /** Compact — smaller text, less padding (used in cards/lists) */
    compact?: boolean;
    style?: StyleProp<ViewStyle>;
    locale?: string;
}

export function AttendanceStatusBadge({
    status,
    showIcon = false,
    compact = false,
    style,
    locale,
}: AttendanceStatusBadgeProps) {
    const bgColor = ATTENDANCE_BG_COLOURS[status];
    const textColor = ATTENDANCE_COLOURS[status];
    const label = ATTENDANCE_LABELS[status];
    const icon = STATUS_ICONS[status];

    return (
        <View
            style={[
                styles.badge,
                compact ? styles.badgeCompact : styles.badgeDefault,
                { backgroundColor: bgColor },
                style,
            ]}
            accessibilityLabel={`Attendance: ${label}`}
        >
            {showIcon && (
                <AppText
                    style={[
                        styles.icon,
                        compact && styles.iconCompact,
                        { color: textColor },
                    ]}
                >
                    {icon}
                </AppText>
            )}
            <AppText
                style={[
                    styles.label,
                    compact ? styles.labelCompact : styles.labelDefault,
                    { color: textColor },
                ]}
            >
                {label}
            </AppText>
        </View>
    );
}

// ─── Today attendance badge (includes NOT_MARKED) ────────────────────────────

interface TodayStatusBadgeProps {
    status: TodayAttendanceStatus;
    compact?: boolean;
    style?: StyleProp<ViewStyle>;
}

export function TodayStatusBadge({ status, compact, style }: TodayStatusBadgeProps) {
    if (status === 'NOT_MARKED') {
        return (
            <View
                style={[
                    styles.badge,
                    compact ? styles.badgeCompact : styles.badgeDefault,
                    styles.notMarked,
                    style,
                ]}
                accessibilityLabel="Attendance not marked yet"
            >
                <AppText
                    style={[
                        styles.label,
                        compact ? styles.labelCompact : styles.labelDefault,
                        { color: Colors.textTertiary },
                    ]}
                >
                    Not Marked
                </AppText>
            </View>
        );
    }

    return (
        <AttendanceStatusBadge
            status={status as AttendanceStatus}
            compact={compact}
            style={style}
        />
    );
}

// ─── Dot indicator (tiny, for calendar/list row) ──────────────────────────────

export function AttendanceDot({
    status,
    size = 10,
    style,
}: {
    status: AttendanceStatus;
    size?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: ATTENDANCE_COLOURS[status],
                },
                style,
            ]}
            accessibilityLabel={ATTENDANCE_LABELS[status]}
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    badgeDefault: {
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    badgeCompact: {
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    notMarked: {
        backgroundColor: Colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    icon: {
        fontSize: FontSize.sm,
        marginRight: 4,
        fontWeight: FontWeight.bold,
    },
    iconCompact: {
        fontSize: FontSize.xs,
    },
    label: {
        fontWeight: FontWeight.semiBold,
    },
    labelDefault: {
        fontSize: FontSize.sm,
    },
    labelCompact: {
        fontSize: FontSize.xs,
    },
});