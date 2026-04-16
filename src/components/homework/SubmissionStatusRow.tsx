import React, { useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, HitSlop } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatRelative } from '../../utils/date.utils';
import type {
    SubmissionStatusRow as SubmissionStatusRowType,
    SubmissionStatus,
} from '../../types/homework.types';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    SubmissionStatus,
    { label: string; colour: string; bg: string; icon: string }
> = {
    PENDING: { label: 'Pending', colour: Colors.textTertiary, bg: Colors.surfaceSecondary, icon: '○' },
    SUBMITTED: { label: 'Submitted', colour: Colors.success, bg: Colors.successLight, icon: '✓' },
    LATE: { label: 'Late', colour: Colors.warning, bg: Colors.warningLight, icon: '⏱' },
    GRADED: { label: 'Graded', colour: Colors.primary, bg: Colors.primarySubtle, icon: '★' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SubmissionStatusRowProps {
    submission: SubmissionStatusRowType;
    /** Called when teacher taps to toggle submitted/pending */
    onToggle?: (studentId: string, newStatus: 'SUBMITTED' | 'PENDING') => void;
    /** Show marks awarded (if graded) */
    showMarks?: boolean;
    /** Lock — homework expired */
    locked?: boolean;
    style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubmissionStatusRow({
    submission,
    onToggle,
    showMarks = true,
    locked = false,
    style,
}: SubmissionStatusRowProps) {
    const {
        studentId,
        studentName,
        rollNumber,
        status,
        submittedAt,
        marksAwarded,
        teacherRemarks,
    } = submission;

    const config = STATUS_CONFIG[status];
    const isGraded = status === 'GRADED';
    const canToggle = !locked && !isGraded && !!onToggle;

    const handleToggle = useCallback(() => {
        if (!canToggle) return;
        const next = status === 'SUBMITTED' ? 'PENDING' : 'SUBMITTED';
        onToggle?.(studentId, next);
    }, [canToggle, status, studentId, onToggle]);

    return (
        <TouchableOpacity
            activeOpacity={canToggle ? 0.75 : 1}
            onPress={handleToggle}
            disabled={!canToggle}
            style={[styles.row, style]}
            accessibilityRole={canToggle ? 'button' : 'text'}
            accessibilityLabel={`${studentName}, ${config.label}`}
            accessibilityHint={canToggle ? 'Tap to toggle submission status' : undefined}
        >
            {/* Roll number */}
            <AppText variant="caption" tertiary style={styles.roll} numberOfLines={1}>
                {rollNumber ?? '—'}
            </AppText>

            {/* Avatar */}
            <AppAvatar
                firstName={studentName.split(' ')[0]}
                lastName={studentName.split(' ')[1]}
                size="sm"
                style={styles.avatar}
            />

            {/* Name + timestamp */}
            <View style={styles.nameBlock}>
                <AppText variant="body2" numberOfLines={1} style={styles.name}>
                    {studentName}
                </AppText>
                {submittedAt && (
                    <AppText variant="caption" tertiary numberOfLines={1}>
                        {formatRelative(submittedAt)}
                    </AppText>
                )}
                {teacherRemarks && (
                    <AppText variant="caption" secondary numberOfLines={1}>
                        💬 {teacherRemarks}
                    </AppText>
                )}
            </View>

            {/* Marks (if graded + showMarks) */}
            {showMarks && isGraded && marksAwarded != null && (
                <AppText variant="numeric" style={styles.marks}>
                    {marksAwarded}
                </AppText>
            )}

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                <AppText style={[styles.statusIcon, { color: config.colour }]}>
                    {config.icon}
                </AppText>
                <AppText style={[styles.statusLabel, { color: config.colour }]}>
                    {config.label}
                </AppText>
            </View>
        </TouchableOpacity>
    );
}

// ─── Batch action bar (select all / mark all submitted) ───────────────────────

interface BatchActionBarProps {
    totalCount: number;
    submittedCount: number;
    onMarkAllDone: () => void;
    onMarkAllPending: () => void;
    style?: StyleProp<ViewStyle>;
}

export function BatchActionBar({
    totalCount,
    submittedCount,
    onMarkAllDone,
    onMarkAllPending,
    style,
}: BatchActionBarProps) {
    const pendingCount = totalCount - submittedCount;

    return (
        <View style={[styles.batchBar, style]}>
            <AppText variant="caption" secondary>
                {submittedCount}/{totalCount} submitted
            </AppText>
            <View style={styles.batchActions}>
                {pendingCount > 0 && (
                    <TouchableOpacity
                        onPress={onMarkAllDone}
                        style={[styles.batchBtn, styles.batchBtnPrimary]}
                        hitSlop={HitSlop.sm}
                        accessibilityRole="button"
                        accessibilityLabel="Mark all as submitted"
                    >
                        <AppText style={styles.batchBtnPrimaryText}>
                            ✓ All submitted
                        </AppText>
                    </TouchableOpacity>
                )}
                {submittedCount > 0 && (
                    <TouchableOpacity
                        onPress={onMarkAllPending}
                        style={[styles.batchBtn, styles.batchBtnSecondary]}
                        hitSlop={HitSlop.sm}
                        accessibilityRole="button"
                        accessibilityLabel="Clear all submissions"
                    >
                        <AppText style={styles.batchBtnSecondaryText}>
                            Reset
                        </AppText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 60;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: ROW_HEIGHT,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    roll: {
        width: 28,
        textAlign: 'right',
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    avatar: {
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    nameBlock: {
        flex: 1,
        gap: 2,
    },
    name: {
        // body2
    },
    marks: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        marginRight: Spacing[3],
        minWidth: 32,
        textAlign: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
        gap: 4,
        flexShrink: 0,
    },
    statusIcon: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    statusLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
    },
    batchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surfaceSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    batchActions: {
        flexDirection: 'row',
        gap: Spacing[2],
    },
    batchBtn: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    batchBtnPrimary: {
        backgroundColor: Colors.success,
    },
    batchBtnPrimaryText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.white,
    },
    batchBtnSecondary: {
        backgroundColor: Colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    batchBtnSecondaryText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.textSecondary,
    },
});