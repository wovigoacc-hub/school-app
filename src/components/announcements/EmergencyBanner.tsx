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
import { Spacing, Layout, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatRelative } from '../../utils/date.utils';
import { truncate } from '../../utils/format.utils';
import type { Announcement } from '../../types/announcement.types';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
        outputRange: [-80, 0],
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
        >
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={onPress}
                style={styles.pressable}
            >
                {/* Left: icon with circular background */}
                <View style={styles.iconWrapper}>
                    <Ionicons name="alert-circle" size={24} color="#fff" />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <AppText style={styles.title} numberOfLines={1}>
                            {announcement.title}
                        </AppText>
                        <AppText style={styles.meta}>
                            {formatRelative(announcement.publishedAt)}
                        </AppText>
                    </View>
                    <AppText style={styles.body} numberOfLines={2}>
                        {truncate(announcement.body, 100)}
                    </AppText>
                </View>

                {/* Right: dismiss icon */}
                {onDismiss && (
                    <TouchableOpacity
                        onPress={handleDismiss}
                        style={styles.dismiss}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* Bottom accent line */}
            <View style={styles.accentBar} />
        </Animated.View>
    );
}

// ─── Emergency banner list (stacked) ──────────────────────────────────────────

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
        .slice(0, 3);

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
        >
            <View style={styles.noticeIconWrapper}>
                <Ionicons name="flash" size={16} color={Colors.error} />
            </View>
            <AppText style={styles.noticeText} numberOfLines={1}>
                Emergency: {announcement.title}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={Colors.error} />
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#991b1b', // richer dark red
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[4],
        gap: Spacing[3],
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    title: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: '#ffffff',
        flex: 1,
        marginRight: Spacing[2],
    },
    meta: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    body: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 18,
    },
    dismiss: {
        padding: 4,
    },
    accentBar: {
        height: 3,
        backgroundColor: '#ef4444', // vibrant red accent
        width: '100%',
    },
    list: {
        // base list container
    },
    listItem: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[2.5],
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: Spacing[2],
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    noticeIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noticeText: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semiBold,
        color: Colors.error,
    },
});