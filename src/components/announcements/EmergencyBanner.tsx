import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { Colors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatRelative } from '../../utils/date.utils';
import { truncate } from '../../utils/format.utils';
import type { Announcement } from '../../types/announcement.types';

// ─── Single emergency banner ──────────────────────────────────────────────────

interface EmergencyBannerProps {
    announcement: Announcement;
    onPress?: () => void;
    onDismiss?: (id: string) => void;
    style?: StyleProp<ViewStyle>;
}

export function EmergencyBanner({
    announcement,
    onPress,
    onDismiss,
    style,
}: EmergencyBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Slide in on mount
    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, opacityAnim]);

    const handleDismiss = () => {
        // Slide out animation before unmounting
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setDismissed(true);
            onDismiss?.(announcement.id);
        });
    };

    if (dismissed) return null;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-60, 0],
    });

    return (
        <Animated.View
            style={[
                styles.banner,
                style,
                { transform: [{ translateY }], opacity: opacityAnim },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            accessibilityLabel={`Emergency: ${announcement.title}`}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                style={styles.pressable}
                accessibilityRole="button"
                accessibilityHint="Tap for full details"
            >
                {/* Left: icon + content */}
                <View style={styles.left}>
                    <AppText style={styles.icon}>🚨</AppText>
                    <View style={styles.textBlock}>
                        <AppText style={styles.title} numberOfLines={1}>
                            {announcement.title}
                        </AppText>
                        <AppText style={styles.body} numberOfLines={2}>
                            {truncate(announcement.body, 120)}
                        </AppText>
                        <AppText style={styles.meta}>
                            {announcement.authorName} · {formatRelative(announcement.publishedAt)}
                        </AppText>
                    </View>
                </View>

                {/* Right: dismiss */}
                {onDismiss && (
                    <TouchableOpacity
                        onPress={handleDismiss}
                        style={styles.dismissButton}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss emergency notice"
                    >
                        <AppText style={styles.dismissIcon}>✕</AppText>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* Pulsing bottom border accent */}
            <View style={styles.accentBar} />
        </Animated.View>
    );
}

// ─── Emergency banner list (stacked, max 3) ───────────────────────────────────

interface EmergencyBannerListProps {
    announcements: Announcement[];
    onPress?: (announcement: Announcement) => void;
    onDismiss?: (id: string) => void;
    style?: StyleProp<ViewStyle>;
}

export function EmergencyBannerList({
    announcements,
    onPress,
    onDismiss,
    style,
}: EmergencyBannerListProps) {
    const emergencies = announcements
        .filter((a) => a.isEmergency && !a.isArchived)
        .slice(0, 3); // cap at 3

    if (!emergencies.length) return null;

    return (
        <View style={[styles.list, style]}>
            {emergencies.map((a, i) => (
                <EmergencyBanner
                    key={a.id}
                    announcement={a}
                    onPress={() => onPress?.(a)}
                    onDismiss={onDismiss}
                    style={i > 0 ? styles.listItem : undefined}
                />
            ))}
        </View>
    );
}

// ─── Compact inline emergency notice (for home screen) ────────────────────────

interface EmergencyNoticeProps {
    announcement: Announcement;
    onPress?: () => void;
}

export function EmergencyNotice({ announcement, onPress }: EmergencyNoticeProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={styles.notice}
            accessibilityRole="button"
            accessibilityLabel={`Emergency notice: ${announcement.title}`}
        >
            <AppText style={styles.noticeIcon}>🚨</AppText>
            <AppText style={styles.noticeText} numberOfLines={1}>
                {announcement.title}
            </AppText>
            <AppText style={styles.noticeArrow}>›</AppText>
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#7f1d1d',   // dark red — high contrast for emergency
        overflow: 'hidden',
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
    },
    left: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    icon: {
        fontSize: 22,
        marginRight: Spacing[3],
        marginTop: 2,
    },
    textBlock: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    body: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
    },
    meta: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    dismissButton: {
        marginLeft: Spacing[3],
        paddingTop: 2,
    },
    dismissIcon: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: FontWeight.bold,
    },
    accentBar: {
        height: 3,
        backgroundColor: '#fca5a5',   // light red accent at bottom
    },
    list: {
        gap: 2,
    },
    listItem: {
        marginTop: 2,
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.errorLight,
        borderRadius: 8,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[2],
        borderWidth: 1,
        borderColor: Colors.errorBorder,
        gap: Spacing[2],
    },
    noticeIcon: {
        fontSize: FontSize.base,
    },
    noticeText: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
        color: Colors.error,
    },
    noticeArrow: {
        fontSize: FontSize.lg,
        color: Colors.error,
    },
});