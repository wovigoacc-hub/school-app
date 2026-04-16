import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppCard } from '../common/AppCard';
import { RequestStatusBadge, PriorityBadge } from '../common/AppBadge';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatRelative, formatDate } from '../../utils/date.utils';
import { REQUEST_TYPE_LABELS } from '../../types/request.types';
import type { ParentRequestSummary } from '../../types/request.types';

// ─── Request type icon ────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
    LEAVE: '🏠',
    COMPLAINT: '📋',
    BONAFIDE_CERTIFICATE: '📜',
    TRANSFER_CERTIFICATE: '📄',
    FEE_INQUIRY: '💰',
    GENERAL_QUERY: '💬',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RequestCardProps {
    request: ParentRequestSummary;
    onPress?: () => void;
    /** Show assignee name (admin/teacher view) */
    showAssignee?: boolean;
    /** Show parent name (admin/teacher view) */
    showParent?: boolean;
    style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RequestCard({
    request,
    onPress,
    showAssignee = false,
    showParent = false,
    style,
}: RequestCardProps) {
    const {
        requestId,
        requestType,
        status,
        priority,
        subject,
        parentName,
        studentName,
        className,
        assignedToName,
        slaDeadline,
        isOverdue,
        messageCount,
        createdAt,
    } = request;

    const icon = TYPE_ICONS[requestType] ?? '📩';
    const typeLabel = REQUEST_TYPE_LABELS[requestType];
    const isOpen = status === 'SUBMITTED' || status === 'UNDER_REVIEW';
    const isClosed = status === 'CLOSED' || status === 'RESPONDED';

    return (
        <AppCard
            style={[
                styles.card,
                isOverdue && styles.cardOverdue,
                isClosed && styles.cardClosed,
                style,
            ]}
            onPress={onPress}
            noPadding
        >
            <View style={styles.inner}>

                {/* Top row */}
                <View style={styles.topRow}>
                    {/* Type icon + label */}
                    <View style={styles.typeChip}>
                        <AppText style={styles.typeIcon}>{icon}</AppText>
                        <AppText variant="caption" secondary>{typeLabel}</AppText>
                    </View>

                    {/* Right: status + priority */}
                    <View style={styles.badges}>
                        {priority !== 'MEDIUM' && (
                            <PriorityBadge priority={priority} style={styles.priorityBadge} />
                        )}
                        <RequestStatusBadge status={status} />
                    </View>
                </View>

                {/* Subject */}
                <AppText
                    variant="subtitle2"
                    numberOfLines={1}
                    style={[styles.subject, isClosed && styles.subjectClosed]}
                >
                    {subject}
                </AppText>

                {/* Student / parent info */}
                {(studentName || showParent) && (
                    <AppText variant="body2" secondary numberOfLines={1}>
                        {studentName && `For ${studentName}${className ? ` · ${className}` : ''}`}
                        {showParent && !studentName && parentName}
                    </AppText>
                )}

                {/* Assignee (admin view) */}
                {showAssignee && assignedToName && (
                    <AppText variant="caption" secondary numberOfLines={1}>
                        Assigned to {assignedToName}
                    </AppText>
                )}

                {/* Bottom row: ref + SLA + time */}
                <View style={styles.bottomRow}>
                    <AppText variant="mono" tertiary style={styles.refId}>
                        {requestId}
                    </AppText>

                    <View style={styles.bottomRight}>
                        {/* SLA deadline */}
                        {isOpen && slaDeadline && (
                            <SlaIndicator deadline={slaDeadline} isOverdue={isOverdue} />
                        )}

                        {/* Message count */}
                        {messageCount > 0 && (
                            <View style={styles.messageCount}>
                                <AppText style={styles.messageCountText}>
                                    💬 {messageCount}
                                </AppText>
                            </View>
                        )}

                        <AppText variant="caption" tertiary>
                            {formatRelative(createdAt)}
                        </AppText>
                    </View>
                </View>
            </View>
        </AppCard>
    );
}

// ─── SLA indicator ────────────────────────────────────────────────────────────

function SlaIndicator({
    deadline,
    isOverdue,
}: {
    deadline: string;
    isOverdue: boolean;
}) {
    const colour = isOverdue ? Colors.error : Colors.warning;
    const label = isOverdue
        ? 'Overdue'
        : `Due ${formatDate(deadline)}`;

    return (
        <View style={[styles.slaBadge, { backgroundColor: isOverdue ? Colors.errorLight : Colors.warningLight }]}>
            <AppText style={[styles.slaText, { color: colour }]}>
                {isOverdue ? '⚠️ ' : '⏱ '}{label}
            </AppText>
        </View>
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
    cardClosed: {
        opacity: 0.75,
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
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[1],
    },
    typeIcon: {
        fontSize: FontSize.base,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    priorityBadge: {
        // no extra style needed
    },
    subject: {
        lineHeight: 20,
    },
    subjectClosed: {
        color: Colors.textSecondary,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing[1],
    },
    refId: {
        fontSize: 10,
    },
    bottomRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    slaBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
    },
    slaText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    messageCount: {
        // just the emoji+count
    },
    messageCountText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
});