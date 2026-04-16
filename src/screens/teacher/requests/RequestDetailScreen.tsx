import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Switch,
    Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { RequestStatusStepper } from '../../../components/requests/RequestStatusStepper';
import { MessageThread } from '../../../components/requests/MessageBubble';
import { RequestStatusBadge, PriorityBadge } from '../../../components/common/AppBadge';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetTeacherRequestDetailQuery,
    useAddTeacherMessageMutation,
    useUpdateTeacherRequestStatusMutation,
} from '../../../services/teacher/requests.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { formatDate, formatDateTime } from '../../../utils/date.utils';
import {
    REQUEST_TYPE_LABELS,
    REQUEST_STATUS_STEPS,
} from '../../../types/request.types';
import type { RequestStatus } from '../../../types/request.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'RequestDetail'
>['route'];

// ─── Status update options ────────────────────────────────────────────────────

const NEXT_STATUS_OPTIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
    SUBMITTED: ['UNDER_REVIEW', 'RESPONDED'],
    UNDER_REVIEW: ['RESPONDED'],
};

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
    } = useGetTeacherRequestDetailQuery(requestId);

    const [addMessage, { isLoading: isSending }] = useAddTeacherMessageMutation();
    const [updateStatus, { isLoading: isUpdating }] = useUpdateTeacherRequestStatusMutation();

    const request = reqData?.data;
    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Reply compose ──────────────────────────────────────────────────────
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);

    const handleSendReply = useCallback(async () => {
        const trimmed = replyText.trim();
        if (!trimmed) return;

        try {
            await addMessage({
                requestId,
                body: { message: trimmed, isInternal },
            }).unwrap();

            setReplyText('');
            setIsInternal(false);
            inputRef.current?.blur();

            // Scroll to bottom after send
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 150);
        } catch {
            dispatch(showErrorToast('Failed to send message'));
        }
    }, [replyText, isInternal, requestId, addMessage, dispatch]);

    // ─── Status update ──────────────────────────────────────────────────────
    const handleStatusUpdate = useCallback(
        async (newStatus: RequestStatus) => {
            try {
                await updateStatus({
                    requestId,
                    body: { status: newStatus },
                }).unwrap();
                dispatch(showSuccessToast(`Status updated to ${newStatus.replace('_', ' ')}`));
            } catch {
                dispatch(showErrorToast('Failed to update status'));
            }
        },
        [requestId, updateStatus, dispatch],
    );

    const confirmStatusUpdate = useCallback(
        (newStatus: RequestStatus) => {
            Alert.alert(
                'Update Status',
                `Mark this request as "${newStatus.replace('_', ' ')}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => handleStatusUpdate(newStatus) },
                ],
            );
        },
        [handleStatusUpdate],
    );

    if (isLoading || !request) {
        return <ScreenWrapper loading statusBar="teacher" />;
    }

    const nextStatuses = NEXT_STATUS_OPTIONS[request.status] ?? [];
    const isClosed = request.status === 'CLOSED' || request.status === 'RESPONDED';
    const isLeaveType = request.requestType === 'LEAVE';
    const leaveData = request.requestData as any;

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <ScreenWrapper noKeyboard noPadding statusBar="teacher">
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    refreshControl={
                        <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Request summary card ──────────────────────────────────── */}
                    <AppCard style={styles.summaryCard}>

                        {/* Type + badges row */}
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
                        <AppText variant="h4" style={styles.subject} numberOfLines={2}>
                            {request.subject}
                        </AppText>

                        {/* Parent + student info */}
                        <View style={styles.metaGrid}>
                            <MetaRow label="From" value={request.parentName} />
                            {request.studentName && (
                                <MetaRow label="Student" value={`${request.studentName}${request.className ? ` · ${request.className}` : ''}`} />
                            )}
                            <MetaRow label="Ref" value={request.requestId} mono />
                            <MetaRow label="Raised" value={formatDateTime(request.createdAt)} />
                            {request.slaDeadline && !isClosed && (
                                <MetaRow
                                    label="SLA"
                                    value={formatDateTime(request.slaDeadline)}
                                    valueColour={request.isOverdue ? Colors.error : Colors.warning}
                                />
                            )}
                        </View>

                        {/* Leave-specific data */}
                        {isLeaveType && leaveData?.startDate && (
                            <>
                                <Divider style={styles.divider} />
                                <View style={styles.leaveDetails}>
                                    <AppText variant="label" secondary>Leave Period</AppText>
                                    <AppText variant="subtitle2">
                                        {formatDate(leaveData.startDate)} – {formatDate(leaveData.endDate)}
                                    </AppText>
                                    {leaveData.reason && (
                                        <AppText variant="body2" secondary style={styles.leaveReason}>
                                            {leaveData.reason}
                                        </AppText>
                                    )}
                                    {leaveData.approved !== undefined && (
                                        <View style={[
                                            styles.leaveStatusBadge,
                                            { backgroundColor: leaveData.approved ? Colors.successLight : Colors.errorLight },
                                        ]}>
                                            <AppText style={{
                                                color: leaveData.approved ? Colors.success : Colors.error,
                                                fontSize: FontSize.sm,
                                                fontWeight: FontWeight.semiBold,
                                            }}>
                                                {leaveData.approved ? '✓ Leave Approved' : '✗ Leave Declined'}
                                            </AppText>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </AppCard>

                    {/* ── Status stepper ───────────────────────────────────────── */}
                    <SectionHeader title="Status" compact />
                    <AppCard style={styles.stepperCard} noPadding>
                        <View style={styles.stepperInner}>
                            <RequestStatusStepper
                                currentStatus={request.status}
                                compact
                            />
                        </View>
                    </AppCard>

                    {/* ── Status action buttons ─────────────────────────────────── */}
                    {nextStatuses.length > 0 && !isClosed && (
                        <>
                            <SectionHeader title="Move to" compact />
                            <View style={styles.statusBtns}>
                                {nextStatuses.map((s) => (
                                    <AppButton
                                        key={s}
                                        label={s.replace('_', ' ')}
                                        variant="secondary"
                                        size="sm"
                                        loading={isUpdating}
                                        onPress={() => confirmStatusUpdate(s)}
                                        style={styles.statusBtn}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    {/* ── Message thread ────────────────────────────────────────── */}
                    <SectionHeader
                        title="Thread"
                        count={request.messages.length}
                        compact
                    />
                    <MessageThread
                        messages={request.messages}
                        currentUserId={userId ?? ''}
                        hideInternal={false}   // teachers see internal notes
                        style={styles.thread}
                    />

                    <Spacer size={Spacing[4]} />
                </ScrollView>

                {/* ── Reply box (fixed at bottom, above keyboard) ─────────────── */}
                {!isClosed && (
                    <View style={styles.replyBar}>
                        {/* Internal toggle */}
                        <View style={styles.internalRow}>
                            <AppText variant="caption" secondary>Internal note</AppText>
                            <Switch
                                value={isInternal}
                                onValueChange={setIsInternal}
                                trackColor={{ false: Colors.border, true: Colors.warning }}
                                thumbColor={Colors.white}
                                accessibilityLabel="Toggle internal note"
                            />
                        </View>

                        {/* Input row */}
                        <View style={[
                            styles.inputRow,
                            isInternal && styles.inputRowInternal,
                        ]}>
                            <TextInput
                                ref={inputRef}
                                style={styles.replyInput}
                                value={replyText}
                                onChangeText={setReplyText}
                                placeholder={
                                    isInternal
                                        ? 'Add an internal note (parent cannot see)…'
                                        : 'Write a reply…'
                                }
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
                                accessibilityLabel="Send reply"
                            >
                                <AppText style={styles.sendIcon}>
                                    {isSending ? '⏳' : '➤'}
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {isClosed && (
                    <View style={styles.closedBanner}>
                        <AppText style={styles.closedText}>
                            ✓ This request is {request.status.toLowerCase()}
                        </AppText>
                    </View>
                )}
            </ScreenWrapper>
        </KeyboardAvoidingView>
    );
}

// ─── Meta row helper ──────────────────────────────────────────────────────────

function MetaRow({
    label,
    value,
    mono = false,
    valueColour,
}: {
    label: string;
    value: string;
    mono?: boolean;
    valueColour?: string;
}) {
    return (
        <View style={styles.metaRow}>
            <AppText variant="caption" tertiary style={styles.metaLabel}>
                {label}
            </AppText>
            <AppText
                variant={mono ? 'mono' : 'body2'}
                style={[styles.metaValue, valueColour ? { color: valueColour } : undefined]}
                numberOfLines={1}
            >
                {value}
            </AppText>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
        paddingBottom: Spacing[4],
    },
    summaryCard: {
        marginBottom: Spacing[4],
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
    subject: {
        lineHeight: 26,
    },
    metaGrid: {
        gap: Spacing[2],
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing[3],
    },
    metaLabel: {
        width: 64,
        flexShrink: 0,
    },
    metaValue: {
        flex: 1,
    },
    divider: {
        marginVertical: Spacing[2],
    },
    leaveDetails: {
        gap: Spacing[2],
    },
    leaveReason: {
        lineHeight: 20,
    },
    leaveStatusBadge: {
        alignSelf: 'flex-start',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    stepperCard: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    stepperInner: {
        paddingHorizontal: Spacing[2],
        paddingVertical: Spacing[3],
        overflow: 'hidden',
    },
    statusBtns: {
        flexDirection: 'row',
        gap: Spacing[3],
        marginBottom: Spacing[4],
    },
    statusBtn: {
        flex: 1,
    },
    thread: {
        marginBottom: Spacing[4],
    },
    // ── Reply bar ────────────────────────────────────────────────────────────
    replyBar: {
        backgroundColor: Colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[2],
        paddingBottom: Spacing[3],
        gap: Spacing[2],
    },
    internalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    inputRowInternal: {
        borderColor: Colors.warningBorder,
        backgroundColor: Colors.warningLight,
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
    sendBtnDisabled: {
        backgroundColor: Colors.border,
    },
    sendIcon: {
        fontSize: FontSize.base,
        color: Colors.white,
    },
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