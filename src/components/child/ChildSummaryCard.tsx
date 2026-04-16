import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    type ViewStyle,
  type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { AppCard } from '../common/AppCard';
import {
    TodayStatusBadge,
} from '../attendance/AttendanceStatusBadge';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, IconSize } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import type { LinkedChild } from '../../types/parent.types';
import type { TodayAttendance } from '../../types/attendance.types';
import type { StudentAcademicSummary } from '../../types/student.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChildSummaryCardProps {
    child: LinkedChild;
    todayAttendance?: TodayAttendance;
    summary?: StudentAcademicSummary;
    pendingHomework?: number;
    unreadAnnouncements?: number;
    onPress?: () => void;
    onAttendancePress?: () => void;
    onHomeworkPress?: () => void;
    onResultsPress?: () => void;
    style?: StyleProp<ViewStyle>;
    loading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChildSummaryCard({
    child,
    todayAttendance,
    summary,
    pendingHomework = 0,
    unreadAnnouncements = 0,
    onPress,
    onAttendancePress,
    onHomeworkPress,
    onResultsPress,
    style,
    loading,
}: ChildSummaryCardProps) {
    const attendancePct = summary?.attendance?.attendancePct;

    return (
        <AppCard style={[styles.card, style]} onPress={onPress}>

            {/* Header row: avatar + name + class */}
            <View style={styles.header}>
                <AppAvatar
                    firstName={child.firstName}
                    lastName={child.lastName}
                    photoUrl={child.photoUrl}
                    size="lg"
                    style={styles.avatar}
                />
                <View style={styles.nameBlock}>
                    <AppText variant="subtitle1" numberOfLines={1}>
                        {child.firstName} {child.lastName}
                    </AppText>
                    <AppText variant="body2" secondary numberOfLines={1}>
                        {child.className} {child.section}
                    </AppText>
                </View>

                {/* Today's attendance badge */}
                {todayAttendance && (
                    <TodayStatusBadge
                        status={todayAttendance.status}
                        compact
                    />
                )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Stats row */}
            <View style={styles.statsRow}>

                {/* Attendance % */}
                <StatTile
                    emoji="📅"
                    label="Attendance"
                    value={
                        attendancePct !== null && attendancePct !== undefined
                            ? `${Math.round(attendancePct)}%`
                            : '—'
                    }
                    valueColor={
                        attendancePct !== null && attendancePct !== undefined
                            ? attendancePct >= 75 ? Colors.success
                                : attendancePct >= 70 ? Colors.warning
                                    : Colors.error
                            : Colors.textTertiary
                    }
                    onPress={onAttendancePress}
                />

                {/* Pending homework */}
                <StatTileDivider />
                <StatTile
                    emoji="📚"
                    label="Homework"
                    value={pendingHomework > 0 ? `${pendingHomework} pending` : 'All done'}
                    valueColor={pendingHomework > 0 ? Colors.warning : Colors.success}
                    onPress={onHomeworkPress}
                />

                {/* Latest result */}
                <StatTileDivider />
                <StatTile
                    emoji="📊"
                    label="Results"
                    value={
                        summary?.recentMarks?.[0]
                            ? summary.recentMarks[0].grade ?? `${summary.recentMarks[0].marksObtained}`
                            : '—'
                    }
                    valueColor={Colors.primary}
                    onPress={onResultsPress}
                />
            </View>

            {/* Unread announcements banner */}
            {unreadAnnouncements > 0 && (
                <View style={styles.announcementBanner}>
                    <AppText style={styles.announcementText}>
                        📣 {unreadAnnouncements} new announcement
                        {unreadAnnouncements > 1 ? 's' : ''}
                    </AppText>
                </View>
            )}
        </AppCard>
    );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
    emoji: string;
    label: string;
    value: string;
    valueColor?: string;
    onPress?: () => void;
}

function StatTile({ emoji, label, value, valueColor, onPress }: StatTileProps) {
    const content = (
        <View style={styles.statTile}>
            <AppText style={styles.statEmoji}>{emoji}</AppText>
            <AppText
                style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}
                numberOfLines={1}
            >
                {value}
            </AppText>
            <AppText variant="caption" secondary numberOfLines={1}>
                {label}
            </AppText>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={styles.statTileWrapper}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value}`}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={styles.statTileWrapper}>{content}</View>;
}

function StatTileDivider() {
    return <View style={styles.statDivider} />;
}

// ─── Compact variant (for switcher header) ────────────────────────────────────

interface ChildCompactCardProps {
    child: LinkedChild;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export function ChildCompactCard({ child, onPress, style }: ChildCompactCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.compactCard, style]}
            accessibilityRole="button"
            accessibilityLabel={`${child.firstName} ${child.lastName}`}
        >
            <AppAvatar
                firstName={child.firstName}
                lastName={child.lastName}
                photoUrl={child.photoUrl}
                size="sm"
                style={styles.compactAvatar}
            />
            <View>
                <AppText variant="subtitle2" numberOfLines={1}>
                    {child.firstName}
                </AppText>
                <AppText variant="caption" secondary numberOfLines={1}>
                    {child.className} {child.section}
                </AppText>
            </View>
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        padding: 0,   // override AppCard default — we manage padding per section
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
    },
    avatar: {
        marginRight: Spacing[3],
    },
    nameBlock: {
        flex: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing[4],
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingVertical: Spacing[3],
    },
    statTileWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    statTile: {
        alignItems: 'center',
        paddingHorizontal: Spacing[2],
    },
    statEmoji: {
        fontSize: 20,
        marginBottom: Spacing[0.5],
    },
    statValue: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.semiBold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 2,
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginVertical: Spacing[2],
    },
    announcementBanner: {
        backgroundColor: Colors.primarySubtle,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.primaryBorder,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        borderBottomLeftRadius: BorderRadius.xl,
        borderBottomRightRadius: BorderRadius.xl,
    },
    announcementText: {
        fontSize: FontSize.sm,
        color: Colors.primary,
        fontWeight: FontWeight.medium,
    },
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing[3],
    },
    compactAvatar: {
        marginRight: Spacing[2],
    },
});