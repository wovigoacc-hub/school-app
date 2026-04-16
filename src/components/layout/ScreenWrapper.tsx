import React from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    type ViewStyle,
    type ScrollViewProps,
    type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Layout, Spacing } from '../../constants/spacing';
import { AppStatusBar } from '../common/AppStatusBar';
import { Skeleton } from '../common/AppSkeleton';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScreenWrapperProps {
    children?: React.ReactNode;
    /** Wraps content in a ScrollView */
    scrollable?: boolean;
    /** Remove default horizontal padding */
    noPadding?: boolean;
    /** Remove default vertical padding */
    noPaddingV?: boolean;
    /** Background colour override */
    bgColor?: string;
    /** Show full-screen loading skeleton */
    loading?: boolean;
    /** Custom loading component */
    loadingContent?: React.ReactNode;
    /** Disable keyboard avoiding (for screens with no inputs) */
    noKeyboard?: boolean;
    /** Status bar variant */
    statusBar?: 'default' | 'primary' | 'transparent' | 'teacher' | 'parent';
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    scrollProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;
    /** SafeAreaView edges — defaults to ['top', 'left', 'right'] */
    edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScreenWrapper({
    children,
    scrollable = false,
    noPadding = false,
    noPaddingV = false,
    bgColor,
    loading = false,
    loadingContent,
    noKeyboard = false,
    statusBar = 'default',
    style,
    contentStyle,
    scrollProps,
    edges = ['top', 'left', 'right'],
}: ScreenWrapperProps) {
    const backgroundColor = bgColor ?? Colors.background;

    // ─── Loading state ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView
                style={[styles.safeArea, { backgroundColor }]}
                edges={edges}
            >
                <AppStatusBar variant={statusBar} />
                <View style={[styles.loadingContainer, !noPadding && styles.paddingH]}>
                    {loadingContent ?? <DefaultLoadingSkeleton />}
                </View>
            </SafeAreaView>
        );
    }

    // ─── Content ────────────────────────────────────────────────────────────
    const paddingStyle: ViewStyle = {
        paddingHorizontal: noPadding ? 0 : Layout.screenPaddingH,
        paddingVertical: noPaddingV ? 0 : Layout.screenPaddingV,
    };

    const content = scrollable ? (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                paddingStyle,
                styles.scrollContent,
                contentStyle,
            ]}
            {...scrollProps}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.fill, paddingStyle, contentStyle]}>
            {children}
        </View>
    );

    const wrapped = noKeyboard ? (
        content
    ) : (
        <KeyboardAvoidingView
            style={styles.fill}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {content}
        </KeyboardAvoidingView>
    );

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor }, style]}
            edges={edges}
        >
            <AppStatusBar variant={statusBar} />
            {wrapped}
        </SafeAreaView>
    );
}

// ─── Default loading skeleton ─────────────────────────────────────────────────

function DefaultLoadingSkeleton() {
    return (
        <View style={styles.skeletonContainer}>
            {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonRow}>
                        <Skeleton width={40} height={40} radius={20} style={styles.skeletonAvatar} />
                        <View style={styles.skeletonLines}>
                            <Skeleton height={14} width="60%" style={{ marginBottom: Spacing[2] }} />
                            <Skeleton height={11} width="40%" />
                        </View>
                    </View>
                    <Skeleton height={11} width="90%" style={{ marginTop: Spacing[3] }} />
                    <Skeleton height={11} width="75%" style={{ marginTop: Spacing[2] }} />
                </View>
            ))}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    fill: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    paddingH: {
        paddingHorizontal: Layout.screenPaddingH,
    },
    loadingContainer: {
        flex: 1,
        paddingTop: Spacing[4],
    },
    skeletonContainer: {
        gap: Spacing[4],
    },
    skeletonCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing[4],
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skeletonAvatar: {
        marginRight: Spacing[3],
    },
    skeletonLines: {
        flex: 1,
    },
});