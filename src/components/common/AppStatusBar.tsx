import React from 'react';
import {
    StatusBar,
    Platform,
    View,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppSelector } from '../../app/store';
import { selectUserType } from '../../store/slices/authSlice';

// ─── Status bar colour per context ───────────────────────────────────────────

type StatusBarVariant =
    | 'default'        // white bar, dark icons — most screens
    | 'primary'        // blue bar, light icons — home screens
    | 'transparent'    // transparent — hero images
    | 'teacher'        // teacher role colour
    | 'parent';        // parent role colour

const VARIANT_CONFIG: Record<
    StatusBarVariant,
    { barStyle: 'light-content' | 'dark-content'; backgroundColor: string }
> = {
    default: { barStyle: 'dark-content', backgroundColor: Colors.background },
    primary: { barStyle: 'light-content', backgroundColor: Colors.primary },
    transparent: { barStyle: 'dark-content', backgroundColor: 'transparent' },
    teacher: { barStyle: 'light-content', backgroundColor: Colors.teacher },
    parent: { barStyle: 'light-content', backgroundColor: Colors.parent },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppStatusBarProps {
    variant?: StatusBarVariant;
    /** Override bar style directly */
    barStyle?: 'light-content' | 'dark-content';
    /** Override background colour (Android) */
    bgColor?: string;
    translucent?: boolean;
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppStatusBar({
    variant = 'default',
    barStyle,
    bgColor,
    translucent = false,
    style,
}: AppStatusBarProps) {
    const config = VARIANT_CONFIG[variant];

    const resolvedBarStyle = barStyle ?? config.barStyle;
    const resolvedBgColor = bgColor ?? config.backgroundColor;

    return (
        <StatusBar
            barStyle={resolvedBarStyle}
            backgroundColor={resolvedBgColor}   // Android only
            translucent={translucent}
            animated
        />
    );
}

// ─── Role-aware status bar ────────────────────────────────────────────────────
// Automatically picks the right colour based on the logged-in user role

export function RoleStatusBar({ variant }: { variant?: StatusBarVariant }) {
    const userType = useAppSelector(selectUserType);

    const resolvedVariant = variant ?? (
        userType === 'teacher' ? 'teacher' :
            userType === 'parent' ? 'parent' :
                'default'
    );

    return <AppStatusBar variant={resolvedVariant} />;
}

// ─── Screen header with status bar (for custom headers) ──────────────────────

interface ScreenHeaderBarProps {
    backgroundColor?: string;
    barStyle?: 'light-content' | 'dark-content';
    style?: ViewStyle;
}

/**
 * For screens with custom headers that need status bar colour to match.
 * Renders a coloured View in the status bar area on Android.
 */
export function ScreenHeaderBar({
    backgroundColor = Colors.surface,
    barStyle = 'dark-content',
    style,
}: ScreenHeaderBarProps) {
    return (
        <>
            <StatusBar
                barStyle={barStyle}
                backgroundColor={backgroundColor}
                animated
            />
            {/* On Android, fill status bar area when not translucent */}
            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.androidStatusBar,
                        { backgroundColor },
                        style,
                    ]}
                />
            )}
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    androidStatusBar: {
        // Height is handled by StatusBar.currentHeight
        height: StatusBar.currentHeight ?? 0,
    },
});