import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppCard } from '../common/AppCard';
import { HomeworkDueBadge } from './HomeworkDueBadge';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatDate, formatRelative } from '../../utils/date.utils';
import { formatSubmissionRate, truncate } from '../../utils/format.utils';
import type { HomeworkSummary } from '../../types/homework.types';
import type { ParentHomeworkItem } from '../../types/homework.types';

// ─── Teacher homework card ────────────────────────────────────────────────────

interface TeacherHomeworkCardProps {
    homework: HomeworkSummary;
    onPress?: () => void;
    onDelete?: () => void;
    style?: StyleProp<ViewStyle>;
}

export function TeacherHomeworkCard({
    homework,
    onPress,
    onDelete,
    style,
}: TeacherHomeworkCardProps) {
    const {
        title,
        subjectName,
        className,
        section,
        dueDate,
        isGraded,
        isOverdue,
        totalStudents,
        submittedCount,
        pendingCount,
        submissionRate,
        createdAt,
    } = homework;

    const submissionPct = Math.round(submissionRate);
    const barColour =
        submissionPct >= 80 ? Colors.success :
            submissionPct >= 50 ? Colors.warning :
                Colors.error;

    return (
        <AppCard style={[styles.card, style]} onPress={onPress} noPadding>
            <View style={styles.inner}>

                {/* Header row */}
                <View style={styles.headerRow}>
                    <View style={styles.subjectChip}>
                        <AppText style={styles.subjectDot}>●</AppText>
                        <AppText variant="label" color={Colors.primary} numberOfLines={1}>
                            {subjectName}
                        </AppText>
                    </View>
                    <AppText variant="caption" tertiary>
                        {formatRelative(createdAt)}
                    </AppText>
                </View>

                {/* Title */}
                <AppText variant="subtitle1" numberOfLines={2} style={styles.title}>
                    {title}
                </AppText>

                {/* Class + due date row */}
                <View style={styles.metaRow}>
                    <AppText variant="body2" secondary>
                        {className} {section}
                    </AppText>
                    <HomeworkDueBadge dueDate={dueDate} compact />
                </View>

                {/* Submission progress bar */}
                {totalStudents > 0 && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <AppText variant="caption" secondary>
                                Submissions
                            </AppText>
                            <AppText variant="caption" style={{ color: barColour }} bold={false}>
                                {submittedCount}/{totalStudents} ({submissionPct}%)
                            </AppText>
                        </View>
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${submissionPct}%`,
                                        backgroundColor: barColour,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                )}

                {/* Footer: graded badge + pending count + delete */}
                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        {isGraded && (
                            <View style={styles.gradedChip}>
                                <AppText style={styles.gradedText}>Graded</AppText>
                            </View>
                        )}
                        {pendingCount > 0 && (
                            <AppText variant="caption" color={Colors.warning}>
                                {pendingCount} pending
                            </AppText>
                        )}
                    </View>
                    {onDelete && (
                        <TouchableOpacity
                            onPress={onDelete}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel="Delete homework"
                        >
                            <Icon name="trash-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </AppCard>
    );
}

// ─── Parent homework card ─────────────────────────────────────────────────────

interface ParentHomeworkCardProps {
    homework: ParentHomeworkItem;
    onPress?: () => void;
    /** Parent taps "Mark as done" */
    onMarkDone?: () => void;
    style?: StyleProp<ViewStyle>;
}

export function ParentHomeworkCard({
    homework,
    onPress,
    onMarkDone,
    style,
}: ParentHomeworkCardProps) {
    const {
        title,
        subjectName,
        dueDate,
        isGraded,
        isOverdue,
        myStatus,
        submittedAt,
        marksAwarded,
        teacherRemarks,
    } = homework;

    const isSubmitted = myStatus === 'SUBMITTED' || myStatus === 'LATE' || myStatus === 'GRADED';
    const isPending = myStatus === 'PENDING';

    return (
        <AppCard
            style={[styles.card, isOverdue && isPending && styles.cardOverdue, style]}
            onPress={onPress}
            noPadding
        >
            <View style={styles.inner}>

                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.subjectChip}>
                        <AppText style={styles.subjectDot}>●</AppText>
                        <AppText variant="label" color={Colors.primary} numberOfLines={1}>
                            {subjectName}
                        </AppText>
                    </View>
                    <HomeworkDueBadge
                        dueDate={dueDate}
                        submitted={isSubmitted && !isGraded}
                        graded={myStatus === 'GRADED'}
                        grade={marksAwarded != null ? String(marksAwarded) : undefined}
                        compact
                    />
                </View>

                {/* Title */}
                <AppText variant="subtitle1" numberOfLines={2} style={styles.title}>
                    {title}
                </AppText>

                {/* Teacher remarks (if graded) */}
                {teacherRemarks && (
                    <View style={styles.remarksBox}>
                        <View style={styles.remarksHeader}>
                            <Icon name="chatbubble-ellipses-outline" size={14} color={Colors.textSecondary} />
                            <AppText variant="caption" secondary style={{ marginLeft: 4 }}>
                                Teacher Remarks
                            </AppText>
                        </View>
                        <AppText variant="caption" secondary>
                            {truncate(teacherRemarks, 100)}
                        </AppText>
                    </View>
                )}

                {/* Action row */}
                {isPending && !isOverdue && onMarkDone && (
                    <TouchableOpacity
                        onPress={onMarkDone}
                        style={styles.markDoneBtn}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Mark as submitted"
                    >
                        <View style={styles.markDoneInner}>
                            <Icon name="checkmark-circle-outline" size={18} color={Colors.success} style={{ marginRight: 6 }} />
                            <AppText style={styles.markDoneText}>Mark as submitted</AppText>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </AppCard>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    cardOverdue: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.error,
    },
    inner: {
        padding: Spacing[4],
        gap: Spacing[2],
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subjectChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[1],
        flex: 1,
        marginRight: Spacing[2],
    },
    subjectDot: {
        fontSize: 8,
        color: Colors.primary,
    },
    title: {
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressSection: {
        gap: Spacing[1],
        marginTop: Spacing[1],
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressTrack: {
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing[1],
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    gradedChip: {
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
    },
    gradedText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.primary,
    },
    deleteIcon: {
        fontSize: FontSize.base,
    },
    remarksBox: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing[2],
        gap: 4,
    },
    remarksHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    markDoneBtn: {
        backgroundColor: Colors.successLight,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing[2],
        alignItems: 'center',
        marginTop: Spacing[1],
    },
    markDoneInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    markDoneText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
        color: Colors.success,
    },
});