import React, { useEffect, useRef } from 'react';
import {
    View,
    Animated,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '../common/AppText';
import { AppCard } from '../common/AppCard';
import { AttendanceDot } from './AttendanceStatusBadge';
import {
    ATTENDANCE_COLOURS,
    ATTENDANCE_LABELS,
    attendancePctColour,
    isBelowThreshold,
    type SessionCounts,
} from '../../utils/attendance.utils';
import { formatAttendancePct } from '../../utils/format.utils';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import type { AttendanceStatus } from '../../types/attendance.types';

// ─── Ring chart using react-native-svg ───────────────────────────────────────

interface RingProps {
    percentage: number;
    thresholdPct: number;
    size?: number;
    strokeWidth?: number;
}

function AttendanceRing({
    percentage,
    thresholdPct,
    size = 96,
    strokeWidth = 10,
}: RingProps) {
    const animated = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        Animated.timing(animated, {
            toValue: percentage,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [percentage, animated]);

    const strokeDashoffset = animated.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    const ringColour = attendancePctColour(percentage, thresholdPct);

    // AnimatedCircle via Animated.createAnimatedComponent
    const AnimatedCircle = Animated.createAnimatedComponent(Circle);

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Colors.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={ringColour}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    // Rotate so progress starts from top
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* Centre label */}
            <View style={[styles.ringCenter, { width: size, height: size }]}>
                <AppText
                    style={[styles.ringPct, { color: ringColour }]}
                >
                    {Math.round(percentage)}%
                </AppText>
            </View>
        </View>
    );
}

// ─── Count row ────────────────────────────────────────────────────────────────

interface CountRowProps {
    status: AttendanceStatus;
    count: number;
    total: number;
}

function CountRow({ status, count, total }: CountRowProps) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <View style={styles.countRow}>
            <AttendanceDot status={status} size={8} style={styles.countDot} />
            <AppText variant="body2" secondary style={styles.countLabel}>
                {ATTENDANCE_LABELS[status]}
            </AppText>
            <AppText variant="numeric" style={styles.countValue}>
                {count}
            </AppText>
            <AppText variant="caption" tertiary style={styles.countPct}>
                ({pct}%)
            </AppText>
        </View>
    );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface AttendanceSummaryCardProps {
    counts: SessionCounts;
    thresholdPct?: number;
    /** Title — e.g. student name or "Today's Session" */
    title?: string;
    /** Show the threshold warning banner */
    showWarning?: boolean;
    onPress?: () => void;
    style?: ViewStyle;
}

export function AttendanceSummaryCard({
    counts,
    thresholdPct = 75,
    title,
    showWarning = true,
    onPress,
    style,
}: AttendanceSummaryCardProps) {
    const { PRESENT, ABSENT, LATE, LEAVE, HALF_DAY, total } = counts;

    // Effective attendance: present + late + half_day counted as present
    const effectivePresent = (PRESENT ?? 0) + (LATE ?? 0) + ((HALF_DAY ?? 0) * 0.5);
    const percentage = total > 0 ? (effectivePresent / total) * 100 : 100;
    const belowThreshold = isBelowThreshold(percentage, thresholdPct);

    return (
        <AppCard style={[styles.card, style]} onPress={onPress} noPadding>

            {/* Title */}
            {title && (
                <View style={styles.titleRow}>
                    <AppText variant="subtitle1" numberOfLines={1}>
                        {title}
                    </AppText>
                    <AppText variant="caption" secondary>
                        {total} day{total !== 1 ? 's' : ''}
                    </AppText>
                </View>
            )}

            {/* Ring + counts */}
            <View style={styles.body}>
                {/* Ring chart */}
                <AttendanceRing
                    percentage={percentage}
                    thresholdPct={thresholdPct}
                />

                {/* Count breakdown */}
                <View style={styles.counts}>
                    {(PRESENT ?? 0) > 0 && <CountRow status="PRESENT" count={PRESENT ?? 0} total={total} />}
                    {(ABSENT ?? 0) > 0 && <CountRow status="ABSENT" count={ABSENT ?? 0} total={total} />}
                    {(LATE ?? 0) > 0 && <CountRow status="LATE" count={LATE ?? 0} total={total} />}
                    {(LEAVE ?? 0) > 0 && <CountRow status="LEAVE" count={LEAVE ?? 0} total={total} />}
                    {(HALF_DAY ?? 0) > 0 && <CountRow status="HALF_DAY" count={HALF_DAY ?? 0} total={total} />}
                </View>
            </View>

            {/* Threshold warning banner */}
            {showWarning && belowThreshold && (
                <View style={styles.warningBanner}>
                    <AppText style={styles.warningText}>
                        ⚠️ Below {thresholdPct}% minimum attendance
                    </AppText>
                </View>
            )}
        </AppCard>
    );
}

// ─── Session summary (teacher view — post-submission) ────────────────────────

interface SessionSummaryProps {
    counts: SessionCounts;
    date: string;
    className: string;
    section: string;
    style?: ViewStyle;
}

export function SessionSummary({
    counts,
    date,
    className,
    section,
    style,
}: SessionSummaryProps) {
    const { PRESENT, ABSENT, LATE, LEAVE, HALF_DAY, total } = counts;
    const percentage = total > 0 ? Math.round(((PRESENT ?? 0) / total) * 100) : 100;

    return (
        <View style={[styles.sessionSummary, style]}>
            {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY'] as AttendanceStatus[]).map(
                (s) => {
                    const count = counts[s] ?? 0;
                    if (count === 0) return null;
                    return (
                        <View key={s} style={styles.sessionChip}>
                            <AppText
                                style={[styles.sessionChipCount, { color: ATTENDANCE_COLOURS[s] }]}
                            >
                                {count}
                            </AppText>
                            <AppText style={[styles.sessionChipLabel, { color: ATTENDANCE_COLOURS[s] }]}>
                                {s === 'HALF_DAY' ? 'H' : s.charAt(0)}
                            </AppText>
                        </View>
                    );
                },
            )}
            <View style={styles.sessionTotal}>
                <AppText variant="caption" tertiary>
                    {total} total · {percentage}% present
                </AppText>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[2],
    },
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        gap: Spacing[4],
    },
    ringCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringPct: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    counts: {
        flex: 1,
        gap: Spacing[2],
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countDot: {
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    countLabel: {
        flex: 1,
    },
    countValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
        marginRight: 4,
    },
    countPct: {
        fontSize: FontSize.xs,
        width: 36,
    },
    warningBanner: {
        backgroundColor: Colors.warningLight,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.warningBorder,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
    },
    warningText: {
        fontSize: FontSize.sm,
        color: Colors.warning,
        fontWeight: FontWeight.medium,
    },
    sessionSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    sessionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
        gap: 3,
    },
    sessionChipCount: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    sessionChipLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    sessionTotal: {
        marginLeft: 'auto',
    },
});