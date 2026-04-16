import React, { useRef, useEffect } from 'react';
import {
    ScrollView,
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { useActiveChild } from '../../hooks/useActiveChild';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, AvatarSize } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import type { LinkedChild } from '../../types/parent.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChildSwitcherProps {
    /** Triggered after the active child changes — use to refetch child-specific data */
    onSwitch?: (child: LinkedChild) => void;
    style?: StyleProp<ViewStyle>;
    /** Show school class label under name */
    showClass?: boolean;
    /** Compact mode — smaller avatars and text, for inline use */
    compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChildSwitcher({
    onSwitch,
    style,
    showClass = true,
    compact = false,
}: ChildSwitcherProps) {
    const { children, activeChildId, switchChild } = useActiveChild();
    const scrollRef = useRef<ScrollView>(null);

    // Scroll to active child on mount and when it changes
    useEffect(() => {
        if (!activeChildId || !children.length) return;
        const index = children.findIndex((c) => c.studentId === activeChildId);
        if (index > 0) {
            // Approximate scroll — each item is ~ITEM_WIDTH + gap
            const ITEM_WIDTH = compact ? 64 : 80;
            const GAP = Spacing[3];
            scrollRef.current?.scrollTo({
                x: index * (ITEM_WIDTH + GAP),
                animated: true,
            });
        }
    }, [activeChildId, children, compact]);

    if (children.length <= 1) return null; // no switcher needed for single child

    const handleSelect = (child: LinkedChild) => {
        switchChild(child.studentId);
        onSwitch?.(child);
    };

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
                styles.scrollContent,
                compact && styles.scrollContentCompact,
            ]}
            style={[styles.scroll, style]}
            accessibilityRole="tablist"
            accessibilityLabel="Switch child"
        >
            {children.map((child) => {
                const isActive = child.studentId === activeChildId;
                return (
                    <ChildChip
                        key={child.studentId}
                        child={child}
                        isActive={isActive}
                        onPress={() => handleSelect(child)}
                        showClass={showClass}
                        compact={compact}
                    />
                );
            })}
        </ScrollView>
    );
}

// ─── Individual child chip ────────────────────────────────────────────────────

interface ChildChipProps {
    child: LinkedChild;
    isActive: boolean;
    onPress: () => void;
    showClass?: boolean;
    compact?: boolean;
}

function ChildChip({ child, isActive, onPress, showClass, compact }: ChildChipProps) {
    const avatarSize = compact ? 'sm' : 'md';
    const displayName = child.firstName;

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[
                styles.chip,
                compact ? styles.chipCompact : styles.chipDefault,
                isActive && styles.chipActive,
            ]}
            accessibilityRole="tab"
            accessibilityLabel={`${child.firstName} ${child.lastName}`}
            accessibilityState={{ selected: isActive }}
        >
            {/* Avatar with active ring */}
            <View
                style={[
                    styles.avatarWrapper,
                    isActive && styles.avatarRing,
                ]}
            >
                <AppAvatar
                    firstName={child.firstName}
                    lastName={child.lastName}
                    photoUrl={child.photoUrl}
                    size={avatarSize}
                />
            </View>

            {/* Name */}
            <AppText
                style={[
                    styles.name,
                    compact && styles.nameCompact,
                    isActive ? styles.nameActive : styles.nameInactive,
                ]}
                numberOfLines={1}
            >
                {displayName}
            </AppText>

            {/* Class label */}
            {showClass && !compact && (
                <AppText
                    style={[
                        styles.classLabel,
                        isActive ? styles.classLabelActive : styles.classLabelInactive,
                    ]}
                    numberOfLines={1}
                >
                    {child.className} {child.section}
                </AppText>
            )}
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingHorizontal: Spacing[4],
        gap: Spacing[3],
        paddingVertical: Spacing[2],
    },
    scrollContentCompact: {
        gap: Spacing[2],
        paddingVertical: Spacing[1],
    },
    chip: {
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
        padding: Spacing[2],
        borderWidth: 1.5,
    },
    chipDefault: {
        width: 80,
        paddingVertical: Spacing[2],
    },
    chipCompact: {
        width: 64,
        paddingVertical: Spacing[1.5],
    },
    chipActive: {
        backgroundColor: Colors.primarySubtle,
        borderColor: Colors.primaryBorder,
    },
    chipInactive: {
        backgroundColor: Colors.surface,
        borderColor: Colors.border,
    },
    avatarWrapper: {
        marginBottom: Spacing[1],
        borderRadius: AvatarSize.md / 2 + 3,
    },
    avatarRing: {
        borderWidth: 2.5,
        borderColor: Colors.primary,
        borderRadius: AvatarSize.md / 2 + 3,
        padding: 2,
    },
    name: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        textAlign: 'center',
        maxWidth: 68,
    },
    nameCompact: {
        maxWidth: 56,
    },
    nameActive: {
        color: Colors.primary,
    },
    nameInactive: {
        color: Colors.textSecondary,
    },
    classLabel: {
        fontSize: 8,
        textAlign: 'center',
        maxWidth: 68,
        marginTop: 2,
    },
    classLabelActive: {
        color: Colors.primaryLight,
    },
    classLabelInactive: {
        color: Colors.textTertiary,
    },
});