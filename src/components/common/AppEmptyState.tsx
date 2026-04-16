import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppEmptyStateProps {
    /** Large emoji or icon — use emoji for zero-dependency icons */
    icon?: string | React.ReactNode;
    title: string;
    message?: string;
    /** Primary action button */
    actionLabel?: string;
    onAction?: () => void;
    /** Secondary action link */
    secondaryLabel?: string;
    onSecondary?: () => void;
    style?: ViewStyle;
    /** Compact mode — smaller spacing and text */
    compact?: boolean;
}

// ─── Preset configurations ────────────────────────────────────────────────────

export const EMPTY_STATES = {
    attendance: {
        icon: '📋',
        title: 'No attendance records',
        message: 'Attendance data will appear here once sessions are marked.',
    },
    homework: {
        icon: '📚',
        title: 'No homework',
        message: 'Homework assigned to your classes will appear here.',
    },
    results: {
        icon: '📊',
        title: 'No results yet',
        message: 'Exam results will appear here once they are published.',
    },
    announcements: {
        icon: '📣',
        title: 'No announcements',
        message: 'School announcements will appear here.',
    },
    requests: {
        icon: '📩',
        title: 'No requests',
        message: 'Parent requests assigned to you will appear here.',
    },
    notifications: {
        icon: '🔔',
        title: 'No notifications',
        message: "You're all caught up!",
    },
    search: {
        icon: '🔍',
        title: 'No results found',
        message: 'Try adjusting your search or filters.',
    },
    offline: {
        icon: '📡',
        title: 'No connection',
        message: 'Check your internet connection and try again.',
    },
} as const;

export type EmptyStatePreset = keyof typeof EMPTY_STATES;

// ─── Component ────────────────────────────────────────────────────────────────

interface AppEmptyStateWithPresetProps extends Omit<AppEmptyStateProps, 'title' | 'icon' | 'message'> {
    preset: EmptyStatePreset;
    title?: string;
    icon?: string | React.ReactNode;
    message?: string;
}

export function AppEmptyState({
    icon,
    title,
    message,
    actionLabel,
    onAction,
    secondaryLabel,
    onSecondary,
    style,
    compact = false,
}: AppEmptyStateProps) {
    return (
        <View
            style={[styles.container, compact && styles.containerCompact, style]}
            accessibilityLiveRegion="polite"
        >
            {/* Icon */}
            {icon && (
                <View style={[styles.iconWrapper, compact && styles.iconWrapperCompact]}>
                    {typeof icon === 'string' ? (
                        <AppText style={[styles.emoji, compact && styles.emojiCompact]}>
                            {icon}
                        </AppText>
                    ) : (
                        icon
                    )}
                </View>
            )}

            {/* Text */}
            <AppText
                variant={compact ? 'subtitle2' : 'h4'}
                center
                style={styles.title}
            >
                {title}
            </AppText>

            {message && (
                <AppText
                    variant={compact ? 'body2' : 'body1'}
                    secondary
                    center
                    style={[styles.message, compact && styles.messageCompact]}
                >
                    {message}
                </AppText>
            )}

            {/* Primary action */}
            {actionLabel && onAction && (
                <AppButton
                    label={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    style={[styles.actionButton, compact && styles.actionButtonCompact]}
                />
            )}

            {/* Secondary action */}
            {secondaryLabel && onSecondary && (
                <AppButton
                    label={secondaryLabel}
                    onPress={onSecondary}
                    variant="ghost"
                    style={styles.secondaryButton}
                />
            )}
        </View>
    );
}

// ─── Preset variant ────────────────────────────────────────────────────────────

export function PresetEmptyState({
    preset,
    title,
    icon,
    message,
    ...rest
}: AppEmptyStateWithPresetProps) {
    const config = EMPTY_STATES[preset];
    return (
        <AppEmptyState
            icon={icon ?? config.icon}
            title={title ?? config.title}
            message={message ?? config.message}
            {...rest}
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing[8],
        paddingVertical: Spacing[10],
    },
    containerCompact: {
        paddingVertical: Spacing[6],
        paddingHorizontal: Spacing[6],
    },
    iconWrapper: {
        marginBottom: Spacing[4],
    },
    iconWrapperCompact: {
        marginBottom: Spacing[3],
    },
    emoji: {
        fontSize: 56,
        textAlign: 'center',
    },
    emojiCompact: {
        fontSize: 36,
    },
    title: {
        marginBottom: Spacing[2],
    },
    message: {
        marginBottom: Spacing[6],
        maxWidth: 280,
        lineHeight: 22,
    },
    messageCompact: {
        marginBottom: Spacing[4],
        maxWidth: 240,
    },
    actionButton: {
        minWidth: 180,
    },
    actionButtonCompact: {
        minWidth: 140,
    },
    secondaryButton: {
        marginTop: Spacing[2],
    },
});