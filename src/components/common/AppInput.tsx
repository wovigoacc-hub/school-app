import React, { useState, forwardRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    type TextInputProps,
    type ViewStyle,
    type TextStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from './AppText';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, IconSize, Layout } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppInputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;             // react-hook-form fieldState.error.message
    hint?: string;             // helper text below input
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    /** Show password toggle icon automatically when secureTextEntry is true */
    showToggle?: boolean;
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    required?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AppInput = forwardRef<TextInput, AppInputProps>(
    (
        {
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            showToggle = false,
            secureTextEntry = false,
            style,
            inputStyle,
            required,
            editable = true,
            multiline,
            numberOfLines,
            ...rest
        },
        ref,
    ) => {
        const [isSecure, setIsSecure] = useState(secureTextEntry);
        const hasError = !!error;

        const borderColor = hasError
            ? Colors.inputBorderError
            : Colors.inputBorder;
        const focusBorderColor = hasError
            ? Colors.inputBorderError
            : Colors.inputBorderFocus;

        return (
            <View style={[styles.container, style]}>

                {/* Label */}
                {label && (
                    <View style={styles.labelRow}>
                        <AppText variant="label" color={Colors.textPrimary}>
                            {label}
                        </AppText>
                        {required && (
                            <AppText variant="label" color={Colors.error} style={styles.required}>
                                {' *'}
                            </AppText>
                        )}
                    </View>
                )}

                {/* Input wrapper */}
                <View
                    style={[
                        styles.inputWrapper,
                        { borderColor },
                        !editable && styles.disabled,
                        multiline && styles.multilineWrapper,
                    ]}
                >
                    {/* Left icon */}
                    {leftIcon && (
                        <View style={styles.leftIcon} pointerEvents="none">
                            {leftIcon}
                        </View>
                    )}

                    {/* Text input */}
                    <TextInput
                        ref={ref}
                        style={[
                            styles.input,
                            !!leftIcon && styles.inputWithLeftIcon,
                            (!!rightIcon || showToggle) && styles.inputWithRightIcon,
                            multiline && styles.multilineInput,
                            !editable && styles.disabledText,
                            inputStyle,
                        ]}
                        placeholderTextColor={Colors.inputPlaceholder}
                        secureTextEntry={isSecure}
                        editable={editable}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        textAlignVertical={multiline ? 'top' : 'center'}
                        accessibilityLabel={label}
                        accessibilityHint={hint}
                        onFocus={() => {
                            // Handled via borderColor — no state needed
                        }}
                        {...rest}
                    />

                    {/* Right icon or secure toggle */}
                    {showToggle && secureTextEntry ? (
                        <TouchableOpacity
                            style={styles.rightIcon}
                            onPress={() => setIsSecure((prev) => !prev)}
                            accessibilityRole="button"
                            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <AppText variant="labelSmall" color={Colors.textSecondary}>
                                {isSecure ? 'Show' : 'Hide'}
                            </AppText>
                        </TouchableOpacity>
                    ) : rightIcon ? (
                        <View style={styles.rightIcon} pointerEvents="none">
                            {rightIcon}
                        </View>
                    ) : null}
                </View>

                {/* Error or hint text */}
                {hasError ? (
                    <AppText
                        variant="caption"
                        color={Colors.error}
                        style={styles.helperText}
                        accessibilityRole="alert"
                    >
                        {error}
                    </AppText>
                ) : hint ? (
                    <AppText
                        variant="caption"
                        secondary
                        style={styles.helperText}
                    >
                        {hint}
                    </AppText>
                ) : null}
            </View>
        );
    },
);

AppInput.displayName = 'AppInput';

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT_HEIGHT = Layout.buttonHeight; // 52

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing[1],
    },
    required: {
        // asterisk colour handled via color prop
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderWidth: 1.5,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    multilineWrapper: {
        alignItems: 'flex-start',
        minHeight: INPUT_HEIGHT * 2.5,
    },
    input: {
        flex: 1,
        height: INPUT_HEIGHT,
        paddingHorizontal: Layout.inputPaddingH,
        fontSize: FontSize.base,
        color: Colors.inputText,
        // Remove default Android underline
        includeFontPadding: false,
    },
    inputWithLeftIcon: {
        paddingLeft: Spacing[1],
    },
    inputWithRightIcon: {
        paddingRight: Spacing[1],
    },
    multilineInput: {
        height: undefined,
        paddingTop: Layout.inputPaddingV,
        paddingBottom: Layout.inputPaddingV,
    },
    leftIcon: {
        paddingLeft: Layout.inputPaddingH,
        paddingRight: Spacing[2],
        height: INPUT_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightIcon: {
        paddingRight: Layout.inputPaddingH,
        paddingLeft: Spacing[2],
        height: INPUT_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        backgroundColor: Colors.surfaceSecondary,
        borderColor: Colors.border,
    },
    disabledText: {
        color: Colors.textTertiary,
    },
    helperText: {
        marginTop: Spacing[1],
        marginLeft: Spacing[1],
    },
});