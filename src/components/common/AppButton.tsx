import React from 'react';
import {
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    View,
    type TouchableOpacityProps,
    type ViewStyle,
    type TextStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from './AppText';
import { Colors } from '../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

// ─── Variant config ────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<
    ButtonVariant,
    { container: ViewStyle; text: TextStyle; indicator: string }
> = {
    primary: {
        container: {
            backgroundColor: Colors.buttonPrimary,
            borderWidth: 0,
        },
        text: { color: Colors.buttonPrimaryText },
        indicator: Colors.buttonPrimaryText,
    },
    secondary: {
        container: {
            backgroundColor: Colors.buttonSecondary,
            borderWidth: 1.5,
            borderColor: Colors.buttonSecondaryBorder,
        },
        text: { color: Colors.buttonSecondaryText },
        indicator: Colors.buttonSecondaryText,
    },
    ghost: {
        container: {
            backgroundColor: Colors.transparent,
            borderWidth: 0,
        },
        text: { color: Colors.primary },
        indicator: Colors.primary,
    },
    destructive: {
        container: {
            backgroundColor: Colors.buttonDestructive,
            borderWidth: 0,
        },
        text: { color: Colors.buttonDestructiveText },
        indicator: Colors.buttonDestructiveText,
    },
};

const SIZE_STYLES: Record<
    ButtonSize,
    { container: ViewStyle; text: TextStyle; indicatorSize: number }
> = {
    sm: {
        container: { height: Layout.buttonHeightSm, paddingHorizontal: Spacing[4] },
        text: { fontSize: FontSize.sm },
        indicatorSize: 14,
    },
    md: {
        container: { height: Layout.buttonHeight, paddingHorizontal: Layout.buttonPaddingH },
        text: { fontSize: FontSize.base },
        indicatorSize: 16,
    },
    lg: {
        container: { height: Layout.buttonHeightLg, paddingHorizontal: Spacing[8] },
        text: { fontSize: FontSize.md },
        indicatorSize: 18,
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AppButton({
    label,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    style,
    textStyle,
    ...rest
}: AppButtonProps) {
    const variantStyle = VARIANT_STYLES[variant];
    const sizeStyle = SIZE_STYLES[size];
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            style={[
                styles.base,
                variantStyle.container,
                sizeStyle.container,
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator
                    size={sizeStyle.indicatorSize}
                    color={variantStyle.indicator}
                />
            ) : (
                <>
                    {leftIcon && (
                        <View style={styles.leftIcon}>{leftIcon}</View>
                    )}
                    <AppText
                        variant="button"
                        style={[variantStyle.text, sizeStyle.text, textStyle]}
                        numberOfLines={1}
                    >
                        {label}
                    </AppText>
                    {rightIcon && (
                        <View style={styles.rightIcon}>{rightIcon}</View>
                    )}
                </>
            )}
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        alignSelf: 'flex-start',
    },
    fullWidth: {
        alignSelf: 'stretch',
    },
    disabled: {
        backgroundColor: Colors.buttonDisabled,
        borderColor: Colors.buttonDisabled,
        opacity: 0.7,
    },
    leftIcon: {
        marginRight: Spacing[2],
    },
    rightIcon: {
        marginLeft: Spacing[2],
    },
});