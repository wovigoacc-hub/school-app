import React, { useEffect, useRef } from 'react';
import {
    View,
    Animated,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, AvatarSize } from '../../constants/spacing';
import { UI_CONFIG } from '../../constants/config';

// ─── Base skeleton block ──────────────────────────────────────────────────────

interface SkeletonProps {
    width?: number | `${number}%`;
    height?: number;
    radius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: UI_CONFIG.SKELETON_DURATION_MS,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: UI_CONFIG.SKELETON_DURATION_MS,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [shimmer]);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.4],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius ?? BorderRadius.md,
                    backgroundColor: Colors.skeletonBase,
                    opacity,
                },
                style,
            ]}
        />
    );
}

// ─── Skeleton row (avatar + two text lines) ───────────────────────────────────

export function SkeletonRow({ style }: { style?: ViewStyle }) {
    return (
        <View style={[styles.row, style]}>
            <Skeleton
                width={AvatarSize.md}
                height={AvatarSize.md}
                radius={AvatarSize.md / 2}
                style={styles.rowAvatar}
            />
            <View style={styles.rowLines}>
                <Skeleton height={14} width="65%" style={styles.lineSpacing} />
                <Skeleton height={12} width="45%" />
            </View>
        </View>
    );
}

// ─── Skeleton card (title + body lines) ──────────────────────────────────────

interface SkeletonCardProps {
    lines?: number;
    style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: SkeletonCardProps) {
    return (
        <View style={[styles.card, style]}>
            <Skeleton height={16} width="50%" style={styles.cardTitle} />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height={12}
                    width={i === lines - 1 ? '70%' : '100%'}
                    style={styles.lineSpacing}
                />
            ))}
        </View>
    );
}

// ─── Skeleton attendance row (name + status chips) ────────────────────────────

export function SkeletonAttendanceRow({ style }: { style?: ViewStyle }) {
    return (
        <View style={[styles.row, style]}>
            <Skeleton
                width={AvatarSize.sm}
                height={AvatarSize.sm}
                radius={AvatarSize.sm / 2}
                style={styles.rowAvatar}
            />
            <View style={styles.rowLines}>
                <Skeleton height={14} width="55%" />
            </View>
            <Skeleton height={28} width={72} radius={BorderRadius.full} />
        </View>
    );
}

// ─── Skeleton homework card ───────────────────────────────────────────────────

export function SkeletonHomeworkCard({ style }: { style?: ViewStyle }) {
    return (
        <View style={[styles.card, style]}>
            <View style={styles.homeworkHeader}>
                <Skeleton height={12} width={60} radius={BorderRadius.full} />
                <Skeleton height={12} width={80} radius={BorderRadius.full} />
            </View>
            <Skeleton height={16} width="75%" style={styles.lineSpacing} />
            <Skeleton height={12} width="55%" style={styles.lineSpacing} />
            <View style={[styles.row, styles.homeworkFooter]}>
                <Skeleton height={12} width={100} />
                <Skeleton height={28} width={90} radius={BorderRadius.full} />
            </View>
        </View>
    );
}

// ─── Skeleton mark sheet row ──────────────────────────────────────────────────

export function SkeletonMarkRow({ style }: { style?: ViewStyle }) {
    return (
        <View style={[styles.row, style]}>
            <Skeleton
                width={AvatarSize.sm}
                height={AvatarSize.sm}
                radius={AvatarSize.sm / 2}
                style={styles.rowAvatar}
            />
            <View style={[styles.rowLines, { flex: 1 }]}>
                <Skeleton height={14} width="60%" />
            </View>
            <Skeleton height={44} width={80} radius={BorderRadius.lg} />
        </View>
    );
}

// ─── Skeleton list (repeating rows) ──────────────────────────────────────────

interface SkeletonListProps {
    count?: number;
    itemHeight?: number;
    showAvatar?: boolean;
    style?: ViewStyle;
}

export function SkeletonList({
    count = 5,
    showAvatar = true,
    style,
}: SkeletonListProps) {
    return (
        <View style={style}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonRow
                    key={i}
                    style={i < count - 1 ? styles.listItemSpacing : undefined}
                />
            ))}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowAvatar: {
        marginRight: Spacing[3],
        flexShrink: 0,
    },
    rowLines: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing[4],
    },
    cardTitle: {
        marginBottom: Spacing[3],
    },
    lineSpacing: {
        marginBottom: Spacing[2],
    },
    homeworkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing[2],
    },
    homeworkFooter: {
        justifyContent: 'space-between',
        marginTop: Spacing[3],
    },
    listItemSpacing: {
        marginBottom: Spacing[3],
    },
});