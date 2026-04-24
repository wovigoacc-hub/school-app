import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { AppText } from './AppText';
import { Colors } from '../../constants/colors';
import { AvatarSize, BorderRadius, type AvatarSizeKey } from '../../constants/spacing';
import { FontWeight } from '../../constants/typography';
import { getInitials } from '../../utils/format.utils';

// ─── Avatar size → font size map ──────────────────────────────────────────────

const INITIALS_FONT_SIZE: Record<AvatarSizeKey, number> = {
    xs: 9,
    sm: 11,
    md: 14,
    lg: 17,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
};

// ─── Avatar background colours (assigned by name hash) ───────────────────────

const AVATAR_COLOURS = [
    { bg: '#dbeafe', text: '#1d4ed8' },  // blue
    { bg: '#dcfce7', text: '#15803d' },  // green
    { bg: '#f3e8ff', text: '#7e22ce' },  // purple
    { bg: '#fef3c7', text: '#b45309' },  // amber
    { bg: '#fce7f3', text: '#be185d' },  // pink
    { bg: '#e0f2fe', text: '#0369a1' },  // sky
    { bg: '#ffedd5', text: '#c2410c' },  // orange
    { bg: '#f0fdf4', text: '#166534' },  // emerald
];

function getAvatarColour(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppAvatarProps {
    firstName: string;
    lastName?: string;
    photoUrl?: string | null;
    size?: AvatarSizeKey;
    /** Show green online dot */
    isOnline?: boolean;
    /** Override background color */
    bgColor?: string;
    /** Override text color */
    textColor?: string;
    style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppAvatar({
    firstName,
    lastName,
    photoUrl,
    size = 'md',
    isOnline,
    bgColor,
    textColor,
    style,
}: AppAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const dimension = AvatarSize[size];
    const showImage = !!photoUrl && !imgError;
    const initials = getInitials(firstName, lastName);
    const colours = getAvatarColour(`${firstName}${lastName ?? ''}`);
    const fontSize = INITIALS_FONT_SIZE[size];

    return (
        <View
            style={[
                styles.container,
                {
                    width: dimension,
                    height: dimension,
                    borderRadius: dimension / 2,
                    backgroundColor: showImage
                        ? Colors.surfaceSecondary
                        : (bgColor ?? colours.bg),
                },
                style,
            ]}
            accessibilityLabel={`${firstName} ${lastName ?? ''}`}
        >
            {showImage ? (
                <FastImage
                    style={[
                        styles.image,
                        { width: dimension, height: dimension, borderRadius: dimension / 2 },
                    ]}
                    source={{
                        uri: photoUrl!,
                        priority: FastImage.priority.normal,
                        cache: FastImage.cacheControl.immutable,
                    }}
                    onError={() => setImgError(true)}
                    resizeMode={FastImage.resizeMode.cover}
                />
            ) : (
                <AppText
                    style={{
                        fontSize,
                        fontWeight: FontWeight.semiBold,
                        color: textColor ?? colours.text,
                        lineHeight: fontSize * 1.2,
                    }}
                >
                    {initials}
                </AppText>
            )}

            {/* Online indicator dot */}
            {isOnline && (
                <View
                    style={[
                        styles.onlineDot,
                        {
                            width: dimension * 0.28,
                            height: dimension * 0.28,
                            borderRadius: dimension * 0.14,
                            bottom: 0,
                            right: 0,
                        },
                    ]}
                />
            )}
        </View>
    );
}

// ─── Avatar group (overlapping row) ──────────────────────────────────────────

interface AvatarGroupProps {
    avatars: Array<{ firstName: string; lastName?: string; photoUrl?: string | null }>;
    max?: number;
    size?: AvatarSizeKey;
    style?: StyleProp<ViewStyle>;
}

export function AvatarGroup({ avatars, max = 3, size = 'sm', style }: AvatarGroupProps) {
    const shown = avatars.slice(0, max);
    const overflow = avatars.length - max;
    const dim = AvatarSize[size];
    const offset = Math.floor(dim * 0.35);

    return (
        <View style={[styles.group, style]}>
            {shown.map((a, i) => (
                <View
                    key={i}
                    style={[
                        styles.groupItem,
                        {
                            marginLeft: i === 0 ? 0 : -offset,
                            zIndex: shown.length - i,
                            borderRadius: dim / 2,
                        },
                    ]}
                >
                    <AppAvatar {...a} size={size} />
                </View>
            ))}

            {overflow > 0 && (
                <View
                    style={[
                        styles.overflowBadge,
                        {
                            width: dim,
                            height: dim,
                            borderRadius: dim / 2,
                            marginLeft: -offset,
                        },
                    ]}
                >
                    <AppText
                        style={{
                            fontSize: INITIALS_FONT_SIZE[size],
                            fontWeight: FontWeight.semiBold,
                            color: Colors.textSecondary,
                        }}
                    >
                        +{overflow}
                    </AppText>
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        position: 'absolute',
    },
    onlineDot: {
        position: 'absolute',
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    group: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupItem: {
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    overflowBadge: {
        backgroundColor: Colors.surfaceSecondary,
        borderWidth: 2,
        borderColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
});