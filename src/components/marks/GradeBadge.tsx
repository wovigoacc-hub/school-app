import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AppText } from '../common/AppText';
import { Colors, type ColorKey } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import {
    formatGrade,
    gradeColour,
    formatPercentage,
    formatMarks,
    formatRank,
} from '../../utils/format.utils';

// ─── Grade badge ─────────────────────────────────────────────────────────────

interface GradeBadgeProps {
    grade: string | null;
    size?: 'sm' | 'md' | 'lg';
    style?: StyleProp<ViewStyle>;
    /** Show percentage alongside grade */
    percentage?: number | null;
}

export function GradeBadge({ grade, size = 'md', percentage, style }: GradeBadgeProps) {
    const colour = gradeColour(grade);
    const bg = `${colour}18`;  // 10% opacity — hex alpha

    const sizeStyle = SIZE_STYLES[size];

    return (
        <View
            style={[
                styles.badge,
                sizeStyle.container,
                { backgroundColor: bg, borderColor: `${colour}40` },
                style,
            ]}
            accessibilityLabel={`Grade: ${formatGrade(grade)}${percentage != null ? `, ${formatPercentage(percentage)}` : ''}`}
        >
            <AppText style={[styles.gradeText, sizeStyle.text, { color: colour }]}>
                {formatGrade(grade)}
            </AppText>
            {percentage != null && (
                <AppText style={[styles.pctText, sizeStyle.pct, { color: colour }]}>
                    {formatPercentage(percentage, 0)}
                </AppText>
            )}
        </View>
    );
}

const SIZE_STYLES = {
    sm: {
        container: { paddingHorizontal: Spacing[2], paddingVertical: 3, minWidth: 28 },
        text: { fontSize: FontSize.xs },
        pct: { fontSize: 9 },
    },
    md: {
        container: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], minWidth: 36 },
        text: { fontSize: FontSize.base },
        pct: { fontSize: FontSize.xs },
    },
    lg: {
        container: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], minWidth: 52 },
        text: { fontSize: FontSize.xl },
        pct: { fontSize: FontSize.sm },
    },
};

// ─── Marks display (obtained / max) ──────────────────────────────────────────

interface MarksDisplayProps {
    obtained: number | null;
    max: number;
    isPassed?: boolean | null;
    isAbsent?: boolean;
    style?: StyleProp<ViewStyle>;
    compact?: boolean;
}

export function MarksDisplay({
    obtained,
    max,
    isPassed,
    isAbsent,
    style,
    compact = false,
}: MarksDisplayProps) {
    if (isAbsent) {
        return (
            <View style={[styles.marksContainer, style]}>
                <AppText
                    style={[styles.absText, compact && styles.absTextCompact]}
                >
                    Absent
                </AppText>
            </View>
        );
    }

    if (obtained == null) {
        return (
            <View style={[styles.marksContainer, style]}>
                <AppText variant="caption" tertiary>Not entered</AppText>
            </View>
        );
    }

    const colour = isPassed === false ? Colors.error :
        isPassed === true ? Colors.success :
            Colors.textPrimary;

    return (
        <View style={[styles.marksContainer, style]}>
            <AppText
                style={[
                    styles.marksValue,
                    compact && styles.marksValueCompact,
                    { color: colour },
                ]}
            >
                {obtained}
            </AppText>
            <AppText
                style={[styles.marksMax, compact && styles.marksMaxCompact]}
            >
                /{max}
            </AppText>
        </View>
    );
}

// ─── Pass / Fail indicator ────────────────────────────────────────────────────

interface PassFailBadgeProps {
    isPassed: boolean | null;
    isAbsent?: boolean;
    style?: StyleProp<ViewStyle>;
}

export function PassFailBadge({ isPassed, isAbsent, style }: PassFailBadgeProps) {
    if (isAbsent) {
        return (
            <View style={[styles.pfBadge, styles.pfAbsent, style]}>
                <AppText style={[styles.pfText, { color: Colors.textTertiary }]}>AB</AppText>
            </View>
        );
    }
    if (isPassed === null || isPassed === undefined) return null;

    return (
        <View
            style={[
                styles.pfBadge,
                isPassed ? styles.pfPass : styles.pfFail,
                style,
            ]}
        >
            <AppText style={[styles.pfText, { color: isPassed ? Colors.success : Colors.error }]}>
                {isPassed ? 'PASS' : 'FAIL'}
            </AppText>
        </View>
    );
}

// ─── Class rank chip ──────────────────────────────────────────────────────────

export function RankBadge({
    rank,
    style,
}: {
    rank: number | null;
    style?: StyleProp<ViewStyle>;
}) {
    if (!rank) return null;
    const isTop3 = rank <= 3;
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <View style={[styles.rankBadge, isTop3 && styles.rankBadgeTop, style]}>
            {isTop3 && (
                <AppText style={styles.rankMedal}>{medals[rank - 1]}</AppText>
            )}
            <AppText style={[styles.rankText, isTop3 && styles.rankTextTop]}>
                {formatRank(rank)}
            </AppText>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: 4,
        alignSelf: 'flex-start',
    },
    gradeText: {
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    pctText: {
        fontWeight: FontWeight.medium,
    },
    marksContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    marksValue: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    marksValueCompact: {
        fontSize: FontSize.base,
    },
    marksMax: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        fontVariant: ['tabular-nums'],
    },
    marksMaxCompact: {
        fontSize: FontSize.xs,
    },
    absText: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
    absTextCompact: {
        fontSize: FontSize.xs,
    },
    pfBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    pfPass: {
        backgroundColor: Colors.successLight,
    },
    pfFail: {
        backgroundColor: Colors.errorLight,
    },
    pfAbsent: {
        backgroundColor: Colors.surfaceSecondary,
    },
    pfText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
        backgroundColor: Colors.surfaceSecondary,
        alignSelf: 'flex-start',
    },
    rankBadgeTop: {
        backgroundColor: Colors.warningLight,
    },
    rankMedal: {
        fontSize: FontSize.sm,
    },
    rankText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.textSecondary,
    },
    rankTextTop: {
        color: Colors.warning,
    },
});