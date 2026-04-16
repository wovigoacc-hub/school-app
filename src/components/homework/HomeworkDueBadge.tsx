import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AppText } from '../common/AppText';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import {
    formatDueLabel,
    isOverdue,
    isToday,
    isTomorrow,
} from '../../utils/date.utils';

// ─── Colour logic ─────────────────────────────────────────────────────────────

function getDueColours(dueDate: string): { text: string; bg: string } {
    if (isOverdue(dueDate)) return { text: Colors.error, bg: Colors.errorLight };
    if (isToday(dueDate)) return { text: Colors.warning, bg: Colors.warningLight };
    if (isTomorrow(dueDate)) return { text: Colors.warning, bg: Colors.warningLight };
    return { text: Colors.textSecondary, bg: Colors.surfaceSecondary };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeworkDueBadgeProps {
    dueDate: string;
    /** Already submitted — show green "Submitted" instead */
    submitted?: boolean;
    /** Graded — show grade badge */
    graded?: boolean;
    grade?: string | null;
    style?: StyleProp<ViewStyle>;
    compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeworkDueBadge({
    dueDate,
    submitted = false,
    graded = false,
    grade,
    style,
    compact = false,
}: HomeworkDueBadgeProps) {
    if (graded && grade) {
        return (
            <View style={[styles.badge, styles.gradedBadge, compact && styles.compact, style]}>
                <AppText style={[styles.text, compact && styles.textCompact, { color: Colors.success }]}>
                    ✓ {grade}
                </AppText>
            </View>
        );
    }

    if (submitted) {
        return (
            <View style={[styles.badge, styles.submittedBadge, compact && styles.compact, style]}>
                <AppText style={[styles.text, compact && styles.textCompact, { color: Colors.success }]}>
                    ✓ Submitted
                </AppText>
            </View>
        );
    }

    const { text, bg } = getDueColours(dueDate);
    const label = formatDueLabel(dueDate);

    return (
        <View style={[styles.badge, { backgroundColor: bg }, compact && styles.compact, style]}>
            <AppText style={[styles.text, compact && styles.textCompact, { color: text }]}>
                {isOverdue(dueDate) ? '⚠️ ' : ''}{label}
            </AppText>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    badge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
        alignSelf: 'flex-start',
    },
    compact: {
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    submittedBadge: {
        backgroundColor: Colors.successLight,
    },
    gradedBadge: {
        backgroundColor: Colors.successLight,
    },
    text: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
    },
    textCompact: {
        fontSize: FontSize.xs,
    },
});