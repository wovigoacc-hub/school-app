import React, { useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackScreenProps,
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppChip } from '../../../components/common/AppChip';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import { useActiveChild } from '../../../hooks/useActiveChild';
import { useCreateRequestMutation } from '../../../services/parent/requests.service';
import {
    required,
    maxLength,
    composeValidators,
    endDateAfterStart,
    dateNotInPast,
} from '../../../utils/validation.utils';
import { toISODate, formatDate } from '../../../utils/date.utils';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import {
    REQUEST_TYPE_LABELS,
    type RequestType,
    type RequestPriority,
} from '../../../types/request.types';
import type { ParentNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    ParentNavigatorParamList,
    'RequestCreate'
>['route'];
type Nav = NativeStackNavigationProp<ParentNavigatorParamList>;

// ─── Request type config ──────────────────────────────────────────────────────

const REQUEST_TYPES: Array<{
    value: RequestType;
    emoji: string;
    desc: string;
}> = [
        { value: 'LEAVE', emoji: '🏠', desc: 'Apply for leave' },
        { value: 'COMPLAINT', emoji: '📋', desc: 'Raise a complaint' },
        { value: 'FEE_INQUIRY', emoji: '💰', desc: 'Fee-related query' },
        { value: 'BONAFIDE_CERTIFICATE', emoji: '📜', desc: 'Request bonafide cert' },
        { value: 'TRANSFER_CERTIFICATE', emoji: '📄', desc: 'Request TC' },
        { value: 'GENERAL_QUERY', emoji: '💬', desc: 'Any other query' },
    ];

// ─── Form values ──────────────────────────────────────────────────────────────

interface RequestFormValues {
    subject: string;
    description: string;
    // Leave-specific
    startDate: Date;
    endDate: Date;
    leaveReason: string;
}

// ─── Simple date button ───────────────────────────────────────────────────────

function DateBtn({
    label,
    date,
    onPress,
}: {
    label: string;
    date: Date;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={dbStyles.btn}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${formatDate(date)}`}
        >
            <AppText variant="caption" secondary>{label}</AppText>
            <AppText variant="body2">📅 {formatDate(date)}</AppText>
        </TouchableOpacity>
    );
}
const dbStyles = StyleSheet.create({
    btn: {
        flex: 1,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing[3],
        gap: 2,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RequestCreateScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const { children, activeChild } = useActiveChild();
    const prefillStudentId = route.params?.studentId;
    const prefillType = route.params?.requestType as RequestType | undefined;

    const [selectedType, setSelectedType] = useState<RequestType>(
        prefillType ?? 'GENERAL_QUERY',
    );
    const [selectedStudentId, setSelectedStudentId] = useState(
        prefillStudentId ?? activeChild?.studentId ?? '',
    );

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [createRequest, { isLoading }] = useCreateRequestMutation();

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RequestFormValues>({
        defaultValues: {
            subject: '',
            description: '',
            startDate: tomorrow,
            endDate: tomorrow,
            leaveReason: '',
        },
    });

    const watchedStart = watch('startDate');
    const watchedEnd = watch('endDate');
    const isLeave = selectedType === 'LEAVE';

    const onSubmit = useCallback(
        async (values: RequestFormValues) => {
            try {
                // Build requestData based on type
                let requestData: Record<string, any> | undefined;

                if (isLeave) {
                    requestData = {
                        startDate: toISODate(values.startDate),
                        endDate: toISODate(values.endDate),
                        reason: values.leaveReason,
                    };
                }

                const result = await createRequest({
                    requestType: selectedType,
                    subject: values.subject.trim(),
                    description: values.description.trim(),
                    studentId: selectedStudentId || undefined,
                    requestData,
                }).unwrap();

                dispatch(showSuccessToast('Request submitted'));
                navigation.replace('RequestDetail', { requestId: result.data.id });
            } catch (err: any) {
                const msg = err?.data?.message ?? 'Failed to submit request';
                dispatch(showErrorToast(msg));
            }
        },
        [
            isLeave, selectedType, selectedStudentId,
            createRequest, dispatch, navigation,
        ],
    );

    return (
        <ScreenWrapper scrollable statusBar="parent">
            <SectionHeader title="Raise a Request" style={styles.pageHeader} />

            {/* ── Request type ──────────────────────────────────────────── */}
            <AppText variant="label" secondary style={styles.fieldLabel}>
                Request type
            </AppText>
            <View style={styles.typeGrid}>
                {REQUEST_TYPES.map((rt) => {
                    const isSelected = selectedType === rt.value;
                    return (
                        <TouchableOpacity
                            key={rt.value}
                            onPress={() => setSelectedType(rt.value)}
                            style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                            accessibilityRole="radio"
                            accessibilityLabel={REQUEST_TYPE_LABELS[rt.value]}
                            accessibilityState={{ checked: isSelected }}
                        >
                            <AppText style={styles.typeEmoji}>{rt.emoji}</AppText>
                            <AppText
                                style={[styles.typeLabel, isSelected && { color: Colors.primary }]}
                                numberOfLines={1}
                            >
                                {REQUEST_TYPE_LABELS[rt.value]}
                            </AppText>
                            <AppText
                                style={styles.typeDesc}
                                numberOfLines={1}
                            >
                                {rt.desc}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── Student picker (if multiple children) ─────────────────── */}
            {children.length > 1 && (
                <>
                    <AppText variant="label" secondary style={styles.fieldLabel}>
                        For which child?
                    </AppText>
                    <View style={styles.chipRow}>
                        {children.map((child) => (
                            <AppChip
                                key={child.studentId}
                                label={`${child.firstName} ${child.lastName}`}
                                selected={selectedStudentId === child.studentId}
                                onPress={() => setSelectedStudentId(child.studentId)}
                                size="sm"
                            />
                        ))}
                    </View>
                </>
            )}

            {/* ── Leave-specific fields ─────────────────────────────────── */}
            {isLeave && (
                <AppCard noPadding style={styles.leaveCard}>
                    <View style={styles.leaveInner}>
                        <AppText variant="subtitle2">Leave Details</AppText>

                        {/* Date range */}
                        <View style={styles.dateRow}>
                            <DateBtn
                                label="From"
                                date={watchedStart}
                                onPress={() => setShowStartPicker(true)}
                            />
                            <AppText secondary style={styles.dateTo}>→</AppText>
                            <DateBtn
                                label="To"
                                date={watchedEnd}
                                onPress={() => setShowEndPicker(true)}
                            />
                        </View>

                        {showStartPicker && (
                            <DateTimePicker
                                value={watchedStart}
                                mode="date"
                                minimumDate={new Date()}
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                onChange={(_, d) => {
                                    setShowStartPicker(Platform.OS === 'ios');
                                    if (d) {
                                        setValue('startDate', d);
                                        if (d > watchedEnd) setValue('endDate', d);
                                    }
                                }}
                            />
                        )}
                        {showEndPicker && (
                            <DateTimePicker
                                value={watchedEnd}
                                mode="date"
                                minimumDate={watchedStart}
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                onChange={(_, d) => {
                                    setShowEndPicker(Platform.OS === 'ios');
                                    if (d) setValue('endDate', d);
                                }}
                            />
                        )}

                        {/* Leave reason */}
                        <Controller
                            control={control}
                            name="leaveReason"
                            rules={{ validate: isLeave ? required : undefined }}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <AppInput
                                    ref={ref}
                                    label="Reason for leave"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.leaveReason?.message}
                                    placeholder="Brief reason…"
                                    multiline
                                    numberOfLines={2}
                                    required={isLeave}
                                />
                            )}
                        />
                    </View>
                </AppCard>
            )}

            {/* ── Subject ───────────────────────────────────────────────── */}
            <Controller
                control={control}
                name="subject"
                rules={{ validate: composeValidators(required, maxLength(200)) }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <AppInput
                        ref={ref}
                        label="Subject"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.subject?.message}
                        placeholder={
                            isLeave
                                ? 'e.g. Leave application for Arjun — 3 days'
                                : 'Brief summary of your request…'
                        }
                        returnKeyType="next"
                        required
                        style={styles.field}
                    />
                )}
            />

            {/* ── Description ───────────────────────────────────────────── */}
            <Controller
                control={control}
                name="description"
                rules={{ validate: composeValidators(required, maxLength(2000)) }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <AppInput
                        ref={ref}
                        label="Details"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.description?.message}
                        placeholder="Provide full details of your request…"
                        multiline
                        numberOfLines={4}
                        required
                        style={styles.field}
                    />
                )}
            />

            <Spacer size={Spacing[6]} />

            {/* ── Submit ────────────────────────────────────────────────── */}
            <AppButton
                label={isLoading ? 'Submitting…' : 'Submit Request'}
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
            />

            <Spacer size={Spacing[10]} />
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    pageHeader: {
        paddingTop: Spacing[4],
        marginBottom: Spacing[2],
    },
    fieldLabel: {
        marginTop: Spacing[4],
        marginBottom: Spacing[2],
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    typeCard: {
        width: '30%',
        flexGrow: 1,
        alignItems: 'center',
        padding: Spacing[3],
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        gap: 2,
    },
    typeCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primarySubtle,
    },
    typeEmoji: { fontSize: 22 },
    typeLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    typeDesc: {
        fontSize: 8,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    leaveCard: {
        marginTop: Spacing[4],
        overflow: 'hidden',
    },
    leaveInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    dateTo: {
        fontSize: FontSize.lg,
        flexShrink: 0,
    },
    field: {
        marginTop: Spacing[4],
    },
});