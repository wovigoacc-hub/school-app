import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TouchableOpacityProps,
    type StyleProp,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Shadow, Layout, Spacing } from '../../constants/spacing';

// ─── AppCard ──────────────────────────────────────────────────────────────────

interface AppCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    onLongPress?: () => void;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    /** Remove padding entirely */
    noPadding?: boolean;
    /** Remove shadow */
    flat?: boolean;
    /** Reduce border radius */
    square?: boolean;
    disabled?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

export function AppCard({
    children,
    onPress,
    onLongPress,
    style,
    contentStyle,
    noPadding = false,
    flat = false,
    square = false,
    disabled = false,
    accessibilityLabel,
    accessibilityHint,
}: AppCardProps) {
    const containerStyle: StyleProp<ViewStyle> = [
        styles.card,
        !flat && Shadow.md,
        square && styles.square,
        style,
    ];

    const inner = (
        <View style={[!noPadding && styles.content, contentStyle]}>
            {children}
        </View>
    );

    if (onPress || onLongPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.82}
                onPress={onPress}
                onLongPress={onLongPress}
                disabled={disabled}
                style={containerStyle}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityState={{ disabled }}
            >
                {inner}
            </TouchableOpacity>
        );
    }

    return (
        <View style={containerStyle} accessibilityLabel={accessibilityLabel}>
            {inner}
        </View>
    );
}

// ─── Card separator ───────────────────────────────────────────────────────────

export function CardSeparator({ style }: { style?: StyleProp<ViewStyle> }) {
    return <View style={[styles.separator, style]} />;
}

// ─── Card row (horizontal layout inside a card) ───────────────────────────────

interface CardRowProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Add bottom border */
    bordered?: boolean;
    /** Make tappable */
    onPress?: () => void;
}

export function CardRow({ children, style, bordered, onPress }: CardRowProps) {
    const rowStyle: StyleProp<ViewStyle> = [
        styles.row,
        bordered && styles.rowBordered,
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={rowStyle}
                accessibilityRole="button"
            >
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={rowStyle}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    square: {
        borderRadius: BorderRadius.md,
    },
    content: {
        padding: Layout.cardPaddingH,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginHorizontal: Layout.cardPaddingH,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Layout.cardPaddingV,
        paddingHorizontal: Layout.cardPaddingH,
    },
    rowBordered: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
});