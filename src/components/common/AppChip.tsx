import React from 'react';
import {
    TouchableOpacity,
    View,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, IconSize } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';

// ─── Base chip ────────────────────────────────────────────────────────────────

interface AppChipProps {
    label: string;
    onPress?: () => void;
    selected?: boolean;
    disabled?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    size?: 'sm' | 'md';
}

export function AppChip({
    label,
    onPress,
    selected = false,
    disabled = false,
    leftIcon,
    rightIcon,
    style,
    size = 'md',
}: AppChipProps) {
    const isSmall = size === 'sm';

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            disabled={disabled || !onPress}
            style={[
                styles.chip,
                isSmall ? styles.chipSm : styles.chipMd,
                selected ? styles.chipSelected : styles.chipDefault,
                disabled && styles.chipDisabled,
                style,
            ]}
            accessibilityRole={onPress ? 'button' : 'text'}
            accessibilityLabel={label}
            accessibilityState={{ selected, disabled }}
        >
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

            <AppText
                style={[
                    styles.label,
                    isSmall ? styles.labelSm : styles.labelMd,
                    selected ? styles.labelSelected : styles.labelDefault,
                ]}
                numberOfLines={1}
            >
                {label}
            </AppText>

            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </TouchableOpacity>
    );
}

// ─── Removable chip ───────────────────────────────────────────────────────────

interface RemovableChipProps {
    label: string;
    onRemove: () => void;
    style?: ViewStyle;
}

export function RemovableChip({ label, onRemove, style }: RemovableChipProps) {
    return (
        <View style={[styles.chip, styles.chipMd, styles.chipSelected, style]}>
            <AppText style={[styles.label, styles.labelMd, styles.labelSelected]} numberOfLines={1}>
                {label}
            </AppText>
            <TouchableOpacity
                onPress={onRemove}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label}`}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <AppText style={styles.removeIcon} color={Colors.primary}>
                    ✕
                </AppText>
            </TouchableOpacity>
        </View>
    );
}

// ─── Chip group (horizontal scroll row) ──────────────────────────────────────

interface ChipGroupItem {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface ChipGroupProps {
    items: ChipGroupItem[];
    selectedValue?: string;
    onSelect: (value: string) => void;
    style?: ViewStyle;
    size?: 'sm' | 'md';
}

export function ChipGroup({
    items,
    selectedValue,
    onSelect,
    style,
    size = 'md',
}: ChipGroupProps) {
    return (
        <View style={[styles.chipGroup, style]}>
            {items.map((item) => (
                <AppChip
                    key={item.value}
                    label={item.label}
                    selected={selectedValue === item.value}
                    onPress={() => onSelect(item.value)}
                    leftIcon={item.icon}
                    size={size}
                    style={styles.chipGroupItem}
                />
            ))}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        alignSelf: 'flex-start',
    },
    chipMd: {
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    chipSm: {
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    chipDefault: {
        backgroundColor: Colors.surface,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primarySubtle,
        borderColor: Colors.primaryBorder,
    },
    chipDisabled: {
        opacity: 0.5,
        borderColor: Colors.border,
    },
    label: {
        fontWeight: FontWeight.medium,
    },
    labelMd: {
        fontSize: FontSize.sm,
    },
    labelSm: {
        fontSize: FontSize.xs,
    },
    labelDefault: {
        color: Colors.textSecondary,
    },
    labelSelected: {
        color: Colors.primary,
    },
    leftIcon: {
        marginRight: Spacing[1],
    },
    rightIcon: {
        marginLeft: Spacing[1],
    },
    removeButton: {
        marginLeft: Spacing[1],
    },
    removeIcon: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    chipGroupItem: {
        // individual margin handled by gap in parent
    },
});