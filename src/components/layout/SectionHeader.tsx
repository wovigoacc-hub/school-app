import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from '../common/AppText';
import { CountBadge } from '../common/AppBadge';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
    title: string;
    /** Count badge displayed next to the title */
    count?: number;
    /** Right-side action label */
    actionLabel?: string;
    onAction?: () => void;
    /** Right-side custom element */
    rightElement?: React.ReactNode;
    style?: ViewStyle;
    /** Reduce top/bottom padding */
    compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionHeader({
    title,
    count,
    actionLabel,
    onAction,
    rightElement,
    style,
    compact = false,
}: SectionHeaderProps) {
    return (
        <View style={[styles.container, compact && styles.containerCompact, style]}>
            {/* Left: title + optional count */}
            <View style={styles.left}>
                <AppText variant="h4" numberOfLines={1}>
                    {title}
                </AppText>
                {count !== undefined && count > 0 && (
                    <CountBadge count={count} size="md" style={styles.badge} />
                )}
            </View>

            {/* Right: action button or custom element */}
            {rightElement ?? (
                actionLabel && onAction ? (
                    <TouchableOpacity
                        onPress={onAction}
                        accessibilityRole="button"
                        accessibilityLabel={actionLabel}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <AppText variant="label" color={Colors.primary}>
                            {actionLabel}
                        </AppText>
                    </TouchableOpacity>
                ) : null
            )}
        </View>
    );
}

// ─── Inline sub-section header (smaller, inside cards) ────────────────────────

interface SubSectionHeaderProps {
    title: string;
    style?: ViewStyle;
}

export function SubSectionHeader({ title, style }: SubSectionHeaderProps) {
    return (
        <AppText
            variant="labelSmall"
            secondary
            style={[styles.subSection, style]}
        >
            {title.toUpperCase()}
        </AppText>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing[3],
    },
    containerCompact: {
        paddingVertical: Spacing[2],
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: Spacing[2],
    },
    badge: {
        marginLeft: Spacing[2],
    },
    subSection: {
        paddingVertical: Spacing[2],
        letterSpacing: 0.8,
    },
});