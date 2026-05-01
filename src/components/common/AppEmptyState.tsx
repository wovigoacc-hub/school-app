import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppEmptyStateProps {
    /** Icon name (Ionicons) or custom React Node */
    icon?: string | React.ReactNode;
    /** Color for the icon (if icon is a string) */
    iconColor?: string;
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
        icon: 'calendar-outline',
        iconColor: Colors.warning,
        title: 'No attendance records',
        message: 'Attendance data will appear here once sessions are marked.',
    },
    homework: {
        icon: 'book-outline',
        iconColor: Colors.success,
        title: 'No homework',
        message: 'Homework assigned to your classes will appear here.',
    },
    results: {
        icon: 'stats-chart-outline',
        iconColor: Colors.primary,
        title: 'No results yet',
        message: 'Exam results will appear here once they are published.',
    },
    announcements: {
        icon: 'megaphone-outline',
        iconColor: Colors.parent,
        title: 'No announcements',
        message: 'School announcements will appear here.',
    },
    requests: {
        icon: 'mail-unread-outline',
        iconColor: Colors.info,
        title: 'No requests',
        message: 'Parent requests assigned to you will appear here.',
    },
    notifications: {
        icon: 'notifications-outline',
        iconColor: Colors.primary,
        title: 'No notifications',
        message: "You're all caught up!",
    },
    search: {
        icon: 'search-outline',
        iconColor: Colors.textSecondary,
        title: 'No results found',
        message: 'Try adjusting your search or filters.',
    },
    offline: {
        icon: 'cloud-offline-outline',
        iconColor: Colors.error,
        title: 'No connection',
        message: 'Check your internet connection and try again.',
    },
} as const;

export type EmptyStatePreset = keyof typeof EMPTY_STATES;

// ─── Component ────────────────────────────────────────────────────────────────

interface AppEmptyStateWithPresetProps extends Omit<AppEmptyStateProps, 'title' | 'icon' | 'message' | 'iconColor'> {
    preset: EmptyStatePreset;
    title?: string;
    icon?: string | React.ReactNode;
    iconColor?: string;
    message?: string;
}

export function AppEmptyState({
    icon,
    iconColor,
    title,
    message,
    actionLabel,
    onAction,
    secondaryLabel,
    onSecondary,
    style,
    compact = false,
}: AppEmptyStateProps) {
    const finalIconColor = iconColor ?? Colors.textTertiary;

    return (
        <View
            style={[styles.container, compact && styles.containerCompact, style]}
            accessibilityLiveRegion="polite"
        >
            {/* Icon */}
            {icon && (
                <View style={[styles.iconWrapper, compact && styles.iconWrapperCompact]}>
                    {typeof icon === 'string' ? (
                        <View style={[
                            styles.iconContainer,
                            compact && styles.iconContainerCompact,
                            { backgroundColor: finalIconColor + '15' },
                        ]}>
                            <Ionicons
                                name={icon}
                                size={compact ? 32 : 44}
                                color={finalIconColor}
                            />
                        </View>
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
    iconColor,
    message,
    ...rest
}: AppEmptyStateWithPresetProps) {
    const config = EMPTY_STATES[preset];
    return (
        <AppEmptyState
            icon={icon ?? config.icon}
            iconColor={iconColor ?? config.iconColor}
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
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerCompact: {
        width: 60,
        height: 60,
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