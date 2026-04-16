import React from 'react';
import {
    View,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { formatDateTime } from '../../utils/date.utils';
import type { RequestMessage } from '../../types/request.types';

// ─── Sender type → display config ────────────────────────────────────────────

function getSenderConfig(
    senderType: RequestMessage['senderType'],
    isCurrentUser: boolean,
) {
    if (isCurrentUser) {
        return {
            align: 'right' as const,
            bubbleBg: Colors.primary,
            textColor: Colors.white,
            metaColor: 'rgba(255,255,255,0.7)',
        };
    }
    if (senderType === 'school_user') {
        return {
            align: 'left' as const,
            bubbleBg: Colors.surface,
            textColor: Colors.textPrimary,
            metaColor: Colors.textTertiary,
        };
    }
    // teacher
    return {
        align: 'left' as const,
        bubbleBg: Colors.teacherLight,
        textColor: Colors.textPrimary,
        metaColor: Colors.textTertiary,
    };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
    message: RequestMessage;
    /** The ID of the currently logged-in user — determines which side to render */
    currentUserId: string;
    /** Show sender name above bubble */
    showSender?: boolean;
    /** Show date group header */
    dateHeader?: string;
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MessageBubble({
    message,
    currentUserId,
    showSender = true,
    dateHeader,
    style,
}: MessageBubbleProps) {
    const isCurrentUser = message.senderId === currentUserId;
    const config = getSenderConfig(message.senderType, isCurrentUser);
    const isInternal = message.isInternal;

    return (
        <View style={[styles.wrapper, style]}>

            {/* Date group header */}
            {dateHeader && (
                <View style={styles.dateHeader}>
                    <View style={styles.dateHeaderLine} />
                    <AppText style={styles.dateHeaderText}>{dateHeader}</AppText>
                    <View style={styles.dateHeaderLine} />
                </View>
            )}

            {/* Internal note badge */}
            {isInternal && (
                <View style={styles.internalBadge}>
                    <AppText style={styles.internalText}>🔒 Internal note</AppText>
                </View>
            )}

            <View
                style={[
                    styles.row,
                    config.align === 'right' && styles.rowRight,
                ]}
            >
                {/* Avatar (left side only) */}
                {config.align === 'left' && (
                    <AppAvatar
                        firstName={message.senderName.split(' ')[0]}
                        lastName={message.senderName.split(' ')[1]}
                        size="xs"
                        style={styles.avatar}
                    />
                )}

                {/* Bubble */}
                <View
                    style={[
                        styles.bubble,
                        config.align === 'right'
                            ? styles.bubbleRight
                            : styles.bubbleLeft,
                        { backgroundColor: isInternal ? Colors.warningLight : config.bubbleBg },
                        isInternal && styles.bubbleInternal,
                    ]}
                >
                    {/* Sender name */}
                    {showSender && !isCurrentUser && (
                        <AppText
                            style={[
                                styles.senderName,
                                { color: isInternal ? Colors.warning : Colors.primary },
                            ]}
                            numberOfLines={1}
                        >
                            {message.senderType === 'school_user'
                                ? `${message.senderName} (Staff)`
                                : message.senderType === 'teacher'
                                    ? `${message.senderName} (Teacher)`
                                    : message.senderName}
                        </AppText>
                    )}

                    {/* Message text */}
                    <AppText
                        style={[
                            styles.messageText,
                            { color: isInternal ? Colors.warning : config.textColor },
                        ]}
                    >
                        {message.message}
                    </AppText>

                    {/* Timestamp */}
                    <AppText
                        style={[
                            styles.timestamp,
                            {
                                color: isInternal
                                    ? Colors.textTertiary
                                    : config.metaColor,
                                textAlign: config.align,
                            },
                        ]}
                    >
                        {formatDateTime(message.createdAt)}
                    </AppText>
                </View>
            </View>
        </View>
    );
}

// ─── Thread (list of messages) ────────────────────────────────────────────────

interface MessageThreadProps {
    messages: RequestMessage[];
    currentUserId: string;
    /** Hide internal notes (parent view) */
    hideInternal?: boolean;
    style?: ViewStyle;
}

export function MessageThread({
    messages,
    currentUserId,
    hideInternal = false,
    style,
}: MessageThreadProps) {
    const filtered = hideInternal
        ? messages.filter((m) => !m.isInternal)
        : messages;

    if (!filtered.length) return null;

    return (
        <View style={[styles.thread, style]}>
            {filtered.map((msg, index) => {
                const prev = index > 0 ? filtered[index - 1] : null;

                // Show date header if day changed
                const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
                const thisDate = new Date(msg.createdAt).toDateString();
                const dateHeader = prevDate !== thisDate ? thisDate : undefined;

                // Show sender name if sender changed or day changed
                const showSender =
                    !prev ||
                    prev.senderId !== msg.senderId ||
                    dateHeader !== undefined;

                return (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        currentUserId={currentUserId}
                        showSender={showSender}
                        dateHeader={dateHeader}
                        style={styles.messageSpacer}
                    />
                );
            })}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MAX_BUBBLE_WIDTH = '80%';

const styles = StyleSheet.create({
    wrapper: {
        // outer wrapper per message
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing[4],
    },
    rowRight: {
        flexDirection: 'row-reverse',
    },
    avatar: {
        marginRight: Spacing[2],
        marginBottom: Spacing[1],
        flexShrink: 0,
    },
    bubble: {
        maxWidth: MAX_BUBBLE_WIDTH,
        borderRadius: BorderRadius.xl,
        padding: Spacing[3],
        gap: Spacing[1],
    },
    bubbleLeft: {
        borderBottomLeftRadius: BorderRadius.sm,
    },
    bubbleRight: {
        borderBottomRightRadius: BorderRadius.sm,
    },
    bubbleInternal: {
        borderWidth: 1,
        borderColor: Colors.warningBorder,
        borderStyle: 'dashed',
    },
    senderName: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        marginBottom: 2,
    },
    messageText: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    // ── Date header ─────────────────────────────────────────────────────────
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        gap: Spacing[3],
    },
    dateHeaderLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
    },
    dateHeaderText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    // ── Internal badge ────────────────────────────────────────────────────────
    internalBadge: {
        alignSelf: 'center',
        backgroundColor: Colors.warningLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
        marginBottom: Spacing[1],
    },
    internalText: {
        fontSize: FontSize.xs,
        color: Colors.warning,
        fontWeight: FontWeight.medium,
    },
    // ── Thread ───────────────────────────────────────────────────────────────
    thread: {
        gap: Spacing[2],
    },
    messageSpacer: {
        // gap handled by parent
    },
});