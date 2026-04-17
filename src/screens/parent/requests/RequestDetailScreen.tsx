import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackScreenProps,
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { RequestStatusStepper } from '../../../components/requests/RequestStatusStepper';
import { MessageThread } from '../../../components/requests/MessageBubble';
import { RequestStatusBadge, PriorityBadge } from '../../../components/common/AppBadge';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetParentRequestDetailQuery,
    useAddParentMessageMutation,
    useCloseParentRequestMutation,
} from '../../../services/parent/requests.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDate, formatDateTime, formatRelative } from '../../../utils/date.utils';
import {
    REQUEST_TYPE_LABELS,
} from '../../../types/request.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'RequestDetail'
>['route'];
type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RequestDetailScreen() {
    const route = useRoute<RouteProps>();
    const dispatch = useAppDispatch();
    const { userId } = useAuth();
    const { requestId } = route.params;

    const {
        data: reqData,
        isLoading,
        refetch,
    } = useGetParentRequestDetailQuery(requestId);

    const [addMessage, { isLoading: isSending }] = useAddParentMessageMutation();
    const [closeRequest, { isLoading: isClosing }] = useCloseParentRequestMutation();

    const request = reqData?.data;
    const { refreshing, onRefresh } = useRefresh(refetch);

    const [replyText, setReplyText] = useState('');
    const inputRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);

    // ─── Reply ────────────────────────────────────────────────────────────────
    const handleSendReply = useCallback(async () => {
        const trimmed = replyText.trim();
        if (!trimmed) return;

        try {
            await addMessage({
                requestId,
                body: { message: trimmed },
            }).unwrap();

            setReplyText('');
            inputRef.current?.blur();

            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 150);
        } catch {
            dispatch(showErrorToast('Failed to send message'));
        }
    }, [replyText, requestId, addMessage, dispatch]);

    // ─── Close ────────────────────────────────────────────────────────────────
    const handleClose = useCallback(() => {
        Alert.alert(
            'Close Request?',
            'Mark this request as resolved. You won\'t be able to reply after closing.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close Request',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await closeRequest(requestId).unwrap();
                            dispatch(showSuccessToast('Request closed'));
                        } catch {
                            dispatch(showErrorToast('Could not close request'));
                        }
                    },
                },
            ],
        );
    }, [requestId, closeRequest, dispatch]);

    if (isLoading || !request) {
        return <ScreenWrapper loading={isLoading} statusBar="parent" />;
    }

    const isClosed = request.status === 'CLOSED';
    const isRespondedOrClosed = isClosed || request.status === 'RESPONDED';
    const isLeaveType = request.requestType === 'LEAVE';
    const leaveData = request.requestData as any;

    // Filter out internal notes — parents never see them
    const visibleMessages = request.messages.filter((m) => !m.isInternal);

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <ScreenWrapper noKeyboard noPadding statusBar="parent">
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    refreshControl={
                        <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Summary card ───────────────────────────────────────── */}
                    <AppCard style={styles.summaryCard} noPadding>
                        <View style={styles.summaryInner}>
                            {/* Type + badges */}
                            <View style={styles.badgeRow}>
                                <AppText variant="label" color={Colors.primary}>
                                    {REQUEST_TYPE_LABELS[request.requestType]}
                                </AppText>
                                <View style={styles.badgeGroup}>
                                    <PriorityBadge priority={request.priority} />
                                    <RequestStatusBadge status={request.status} />
                                </View>
                            </View>

                            {/* Subject */}
                            <AppText variant="h4" numberOfLines={2} style={styles.subject}>
                                {request.subject}
                            </AppText>

                            {/* Meta */}
                            <View style={styles.metaGrid}>
                                <MetaRow label="Ref" value={request.requestId} mono />
                                <MetaRow label="Raised" value={formatDateTime(request.createdAt)} />
                                {request.studentName && (
                                    <MetaRow
                                        label="Child"
                                        value={`${request.studentName}${request.className ? ` · ${request.className}` : ''}`}
                                    />
                                )}
                                {request.assignedToName && (
                                    <MetaRow label="Assigned to" value={request.assignedToName} />
                                )}
                            </View>

                            {/* Leave details */}
                            {isLeaveType && leaveData?.startDate && (
                                <>
                                    <Divider style={styles.divider} />
                                    <View style={styles.leaveBlock}>
                                        <AppText variant="label" secondary>Leave period</AppText>
                                        <AppText variant="subtitle2">
                                            {formatDate(leaveData.startDate)} – {formatDate(leaveData.endDate)}
                                        </AppText>
                                        {leaveData.reason && (
                                            <AppText variant="body2" secondary>{leaveData.reason}</AppText>
                                        )}
                                        {leaveData.approved != null && (
                                            <View style={[
                                                styles.leaveApprovalBadge,
                                                {
                                                    backgroundColor: leaveData.approved
                                                        ? Colors.successLight
                                                        : Colors.errorLight,
                                                },
                                            ]}>
                                                <AppText style={{
                                                    fontSize: FontSize.sm,
                                                    fontWeight: FontWeight.semiBold,
                                                    color: leaveData.approved ? Colors.success : Colors.error,
                                                }}>
                                                    {leaveData.approved ? '✓ Approved' : '✗ Declined'}
                                                </AppText>
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}
                        </View>
                    </AppCard>

                    {/* ── Status stepper ─────────────────────────────────────── */}
                    <SectionHeader title="Progress" compact />
                    <AppCard noPadding style={styles.stepperCard}>
                        <View style={styles.stepperInner}>
                            <RequestStatusStepper
                                currentStatus={request.status}
                                compact
                            />
                        </View>
                    </AppCard>

                    {/* ── Close request option (open requests, RESPONDED state) ── */}
                    {request.status === 'RESPONDED' && !isClosed && (
                        <AppButton
                            label={isClosing ? 'Closing…' : 'Mark as Resolved'}
                            variant="secondary"
                            loading={isClosing}
                            onPress={handleClose}
                            fullWidth
                            style={styles.closeBtn}
                        />
                    )}

                    {/* ── Message thread ─────────────────────────────────────── */}
                    <SectionHeader
                        title="Conversation"
                        count={visibleMessages.length}
                        compact
                    />
                    {visibleMessages.length > 0 ? (
                        <MessageThread
                            messages={visibleMessages}
                            currentUserId={userId ?? ''}
                            hideInternal  // parents never see internal notes
                            style={styles.thread}
                        />
                    ) : (
                        <AppText variant="body2" secondary style={styles.noMessages}>
                            No messages yet. Add a message below.
                        </AppText>
                    )}

                    <Spacer size={Spacing[4]} />
                </ScrollView>

                {/* ── Reply bar ──────────────────────────────────────────────── */}
                {!isClosed ? (
                    <View style={styles.replyBar}>
                        <View style={styles.inputRow}>
                            <TextInput
                                ref={inputRef}
                                style={styles.replyInput}
                                value={replyText}
                                onChangeText={setReplyText}
                                placeholder="Add a message…"
                                placeholderTextColor={Colors.inputPlaceholder}
                                multiline
                                maxLength={2000}
                                returnKeyType="default"
                            />
                            <TouchableOpacity
                                onPress={handleSendReply}
                                disabled={!replyText.trim() || isSending}
                                style={[
                                    styles.sendBtn,
                                    (!replyText.trim() || isSending) && styles.sendBtnDisabled,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Send message"
                            >
                                <AppText style={styles.sendIcon}>
                                    {isSending ? '⏳' : '➤'}
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.closedBanner}>
                        <AppText style={styles.closedText}>
                            ✓ Request closed
                        </AppText>
                    </View>
                )}
            </ScreenWrapper>
        </KeyboardAvoidingView>
    );
}

// ─── Meta row ─────────────────────────────────────────────────────────────────

function MetaRow({
    label, value, mono = false,
}: {
    label: string; value: string; mono?: boolean;
}) {
    return (
        <View style={metaStyles.row}>
            <AppText variant="caption" tertiary style={metaStyles.label}>{label}</AppText>
            <AppText variant={mono ? 'mono' : 'body2'} numberOfLines={1} style={metaStyles.value}>
                {value}
            </AppText>
        </View>
    );
}

const metaStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
    label: { width: 80, flexShrink: 0 },
    value: { flex: 1 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scroll: { paddingBottom: Spacing[4] },
    summaryCard: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    summaryInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badgeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    subject: { lineHeight: 26 },
    metaGrid: { gap: Spacing[2] },
    divider: { marginVertical: Spacing[2] },
    leaveBlock: { gap: Spacing[2] },
    leaveApprovalBadge: {
        alignSelf: 'flex-start',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    stepperCard: {
        marginBottom: Spacing[3],
        overflow: 'hidden',
    },
    stepperInner: {
        paddingHorizontal: Spacing[2],
        paddingVertical: Spacing[3],
        overflow: 'hidden',
    },
    closeBtn: {
        marginBottom: Spacing[4],
    },
    thread: {
        marginBottom: Spacing[4],
    },
    noMessages: {
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[4],
        fontStyle: 'italic',
    },
    // ── Reply bar ────────────────────────────────────────────────────────────
    replyBar: {
        backgroundColor: Colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[2],
        gap: Spacing[2],
        minHeight: 52,
    },
    replyInput: {
        flex: 1,
        fontSize: FontSize.base,
        color: Colors.inputText,
        maxHeight: 120,
        paddingTop: Platform.OS === 'ios' ? 4 : 0,
        includeFontPadding: false,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    sendBtnDisabled: { backgroundColor: Colors.border },
    sendIcon: { fontSize: FontSize.base, color: Colors.white },
    closedBanner: {
        backgroundColor: Colors.successLight,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        alignItems: 'center',
    },
    closedText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.success,
    },
});