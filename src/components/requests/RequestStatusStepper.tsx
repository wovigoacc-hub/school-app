import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from '../common/AppText';
import { Colors, REQUEST_STATUS_COLORS } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { REQUEST_STATUS_STEPS } from '../../types/request.types';
import type { RequestStatus } from '../../types/request.types';

// ─── Step icons ───────────────────────────────────────────────────────────────

const STEP_ICONS: Record<RequestStatus, string> = {
    SUBMITTED: '📩',
    UNDER_REVIEW: '🔍',
    RESPONDED: '✉️',
    CLOSED: '✅',
};

const STEP_LABELS: Record<RequestStatus, string> = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'In Review',
    RESPONDED: 'Responded',
    CLOSED: 'Closed',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RequestStatusStepperProps {
    currentStatus: RequestStatus;
    /** Show date below each completed step */
    dates?: Partial<Record<RequestStatus, string>>;
    style?: ViewStyle;
    /** Compact — smaller text, less spacing */
    compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RequestStatusStepper({
    currentStatus,
    dates,
    style,
    compact = false,
}: RequestStatusStepperProps) {
    const currentIndex = REQUEST_STATUS_STEPS.indexOf(currentStatus);

    return (
        <View style={[styles.container, style]}>
            {REQUEST_STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isPending = index > currentIndex;
                const isLast = index === REQUEST_STATUS_STEPS.length - 1;
                const config = REQUEST_STATUS_COLORS[step];

                return (
                    <React.Fragment key={step}>
                        {/* Step */}
                        <View style={styles.stepWrapper}>
                            {/* Circle */}
                            <View
                                style={[
                                    styles.circle,
                                    compact && styles.circleCompact,
                                    isCompleted && { backgroundColor: Colors.success, borderColor: Colors.success },
                                    isCurrent && { backgroundColor: config.text, borderColor: config.text },
                                    isPending && styles.circlePending,
                                ]}
                                accessibilityRole="progressbar"
                                accessibilityLabel={`${STEP_LABELS[step]}: ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}
                            >
                                {isCompleted ? (
                                    <AppText style={[styles.circleIcon, compact && styles.circleIconCompact]}>
                                        ✓
                                    </AppText>
                                ) : isCurrent ? (
                                    <AppText style={[styles.circleIcon, compact && styles.circleIconCompact]}>
                                        {STEP_ICONS[step]}
                                    </AppText>
                                ) : (
                                    <AppText style={[styles.circleIconPending, compact && styles.circleIconCompact]}>
                                        {index + 1}
                                    </AppText>
                                )}
                            </View>

                            {/* Label */}
                            <AppText
                                style={[
                                    styles.label,
                                    compact && styles.labelCompact,
                                    isCompleted && styles.labelCompleted,
                                    isCurrent && [styles.labelCurrent, { color: config.text }],
                                    isPending && styles.labelPending,
                                ]}
                                numberOfLines={1}
                            >
                                {STEP_LABELS[step]}
                            </AppText>

                            {/* Date */}
                            {dates?.[step] && (
                                <AppText style={[styles.date, compact && styles.dateCompact]} numberOfLines={1}>
                                    {dates[step]}
                                </AppText>
                            )}
                        </View>

                        {/* Connector line */}
                        {!isLast && (
                            <View
                                style={[
                                    styles.connector,
                                    compact && styles.connectorCompact,
                                    index < currentIndex
                                        ? styles.connectorCompleted
                                        : styles.connectorPending,
                                ]}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

// ─── Compact single-line variant ──────────────────────────────────────────────

export function RequestStatusBar({
    currentStatus,
    style,
}: {
    currentStatus: RequestStatus;
    style?: ViewStyle;
}) {
    const currentIndex = REQUEST_STATUS_STEPS.indexOf(currentStatus);
    const progress = (currentIndex / (REQUEST_STATUS_STEPS.length - 1)) * 100;
    const config = REQUEST_STATUS_COLORS[currentStatus];

    return (
        <View style={[styles.barContainer, style]}>
            <View style={styles.barTrack}>
                <View
                    style={[
                        styles.barFill,
                        { width: `${progress}%`, backgroundColor: config.text },
                    ]}
                />
            </View>
            <View style={styles.barLabels}>
                <AppText variant="caption" tertiary>
                    {STEP_LABELS[REQUEST_STATUS_STEPS[0]]}
                </AppText>
                <AppText variant="caption" style={{ color: config.text }} semiBold>
                    {STEP_LABELS[currentStatus]}
                </AppText>
                <AppText variant="caption" tertiary>
                    {STEP_LABELS[REQUEST_STATUS_STEPS[REQUEST_STATUS_STEPS.length - 1]]}
                </AppText>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = 44;
const CIRCLE_COMPACT = 32;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing[2],
    },
    stepWrapper: {
        alignItems: 'center',
        width: CIRCLE_SIZE + 24,
    },
    circle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    circleCompact: {
        width: CIRCLE_COMPACT,
        height: CIRCLE_COMPACT,
        borderRadius: CIRCLE_COMPACT / 2,
    },
    circlePending: {
        backgroundColor: Colors.surfaceSecondary,
        borderColor: Colors.border,
    },
    circleIcon: {
        fontSize: FontSize.base,
    },
    circleIconCompact: {
        fontSize: FontSize.sm,
    },
    circleIconPending: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        fontWeight: FontWeight.semiBold,
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
        marginTop: Spacing[1],
        maxWidth: CIRCLE_SIZE + 16,
    },
    labelCompact: {
        fontSize: 9,
    },
    labelCompleted: {
        color: Colors.success,
    },
    labelCurrent: {
        fontWeight: FontWeight.bold,
    },
    labelPending: {
        color: Colors.textTertiary,
    },
    date: {
        fontSize: 9,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: 2,
        maxWidth: CIRCLE_SIZE + 16,
    },
    dateCompact: {
        fontSize: 8,
    },
    connector: {
        flex: 1,
        height: 2,
        marginTop: (CIRCLE_SIZE - 2) / 2,  // vertically centre with circle
        borderRadius: 1,
    },
    connectorCompact: {
        marginTop: (CIRCLE_COMPACT - 2) / 2,
    },
    connectorCompleted: {
        backgroundColor: Colors.success,
    },
    connectorPending: {
        backgroundColor: Colors.border,
    },
    // ── Bar variant ────────────────────────────────────────────────────────
    barContainer: {
        gap: Spacing[1],
    },
    barTrack: {
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    barLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});