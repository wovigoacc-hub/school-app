import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Horizontal divider ────────────────────────────────────────────────────────

interface DividerProps {
    /** Indent from left edge */
    indent?: number;
    style?: StyleProp<ViewStyle>;
    color?: string;
}

export function Divider({ indent = 0, style, color }: DividerProps) {
    return (
        <View
            style={[
                styles.horizontal,
                { marginLeft: indent, borderBottomColor: color ?? Colors.border },
                style,
            ]}
        />
    );
}

// ─── Vertical divider ─────────────────────────────────────────────────────────

export function VerticalDivider({
    height,
    style,
    color,
}: {
    height?: number | `${number}%`;
    style?: StyleProp<ViewStyle>;
    color?: string;
}) {
    return (
        <View
            style={[
                styles.vertical,
                {
                    height: height ?? '100%',
                    borderLeftColor: color ?? Colors.border,
                },
                style,
            ]}
        />
    );
}

// ─── Labelled divider ("— or —") ─────────────────────────────────────────────

export function LabelledDivider({
    label,
    style,
}: {
    label: string;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View style={[styles.labelledRow, style]}>
            <View style={styles.labelledLine} />
            <AppText variant="caption" secondary style={styles.labelledText}>
                {label}
            </AppText>
            <View style={styles.labelledLine} />
        </View>
    );
}

// ─── Spacer ───────────────────────────────────────────────────────────────────

export function Spacer({
    size = Spacing[4],
    horizontal = false,
}: {
    size?: number;
    horizontal?: boolean;
}) {
    return (
        <View
            style={
                horizontal
                    ? { width: size }
                    : { height: size }
            }
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    horizontal: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        width: '100%',
    },
    vertical: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        alignSelf: 'stretch',
    },
    labelledRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing[2],
    },
    labelledLine: {
        flex: 1,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    labelledText: {
        marginHorizontal: Spacing[3],
    },
});