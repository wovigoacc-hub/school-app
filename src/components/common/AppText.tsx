import React from 'react';
import {
    Text,
    StyleSheet,
    type TextProps,
    type TextStyle,
    type StyleProp,
} from 'react-native';
import { TextStyles, FontFamily, type TextStyleKey } from '../../constants/typography';
import { Colors } from '../../constants/colors';
import { useAppSelector } from '../../app/store';
import { selectPreferredLang } from '../../store/slices/authSlice';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppTextProps extends Omit<TextProps, 'style'> {
    /** Named text style variant from typography.ts */
    variant?: TextStyleKey;
    /** Override the text colour */
    color?: string;
    /** Convenience for secondary/tertiary text */
    secondary?: boolean;
    tertiary?: boolean;
    /** Convenience bold override */
    bold?: boolean;
    semiBold?: boolean;
    /** Center align */
    center?: boolean;
    /** Right align */
    right?: boolean;
    /** Stretch to fill container */
    flex?: boolean;
    style?: StyleProp<TextStyle>;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppText({
    variant = 'body1',
    color,
    secondary,
    tertiary,
    bold,
    semiBold,
    center,
    right,
    flex,
    style,
    children,
    ...rest
}: AppTextProps) {
    const preferredLang = useAppSelector(selectPreferredLang);

    // Switch font family based on user language preference
    const fontFamily = preferredLang === 'TAMIL'
        ? FontFamily.tamil
        : preferredLang === 'MALAYALAM'
            ? FontFamily.malayalam
            : undefined;  // use system default for English

    const resolvedColor =
        color ??
        (tertiary ? Colors.textTertiary :
            secondary ? Colors.textSecondary :
                Colors.textPrimary);

    return (
        <Text
            style={[
                TextStyles[variant],
                { color: resolvedColor },
                fontFamily && { fontFamily },
                bold && styles.bold,
                semiBold && styles.semiBold,
                center && styles.center,
                right && styles.right,
                flex && styles.flex,
                style,
            ]}
            {...rest}
        >
            {children}
        </Text>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    bold: { fontWeight: '700' },
    semiBold: { fontWeight: '600' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' },
    flex: { flex: 1 },
});