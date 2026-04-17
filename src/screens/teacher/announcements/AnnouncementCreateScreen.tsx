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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppChip } from '../../../components/common/AppChip';
import { AnnouncementTypeBadge } from '../../../components/common/AppBadge';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import { useCreateTeacherAnnouncementMutation } from '../../../services/teacher/announcements.service';
import {
    required,
    maxLength,
    composeValidators,
} from '../../../utils/validation.utils';
import { toISODate, formatDate, formatDateTime } from '../../../utils/date.utils';
import { ANNOUNCEMENT_COLORS } from '../../../constants/colors';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import type {
    AnnouncementType,
    AnnouncementAudience,
} from '../../../types/announcement.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Type options (teachers can only create class-level — no EMERGENCY) ───────

const TYPE_OPTIONS: Array<{
    value: AnnouncementType;
    label: string;
    emoji: string;
    desc: string;
}> = [
        { value: 'GENERAL', label: 'General', emoji: '📢', desc: 'General notice' },
        { value: 'CIRCULAR', label: 'Circular', emoji: '📄', desc: 'Official circular' },
        { value: 'EXAM_SCHEDULE', label: 'Exam Schedule', emoji: '📅', desc: 'Exam dates & details' },
        { value: 'EVENT', label: 'Event', emoji: '🎉', desc: 'Upcoming event' },
        { value: 'HOLIDAY', label: 'Holiday', emoji: '🏖️', desc: 'Holiday notice' },
        { value: 'PARENT_MEETING', label: 'Parent Meeting', emoji: '👥', desc: 'Parent-teacher meeting' },
    ];

// ─── Audience options ─────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS: Array<{
    value: AnnouncementAudience;
    label: string;
    desc: string;
}> = [
        { value: 'ALL', label: 'Everyone', desc: 'All teachers and parents' },
        { value: 'PARENTS', label: 'Parents', desc: 'Parents of selected classes' },
        { value: 'TEACHERS', label: 'Teachers', desc: 'All teachers in your school' },
        { value: 'SPECIFIC_CLASSES', label: 'Classes', desc: 'Select specific classes below' },
    ];

// ─── Form shape ───────────────────────────────────────────────────────────────

interface AnnouncementFormValues {
    title: string;
    body: string;
    type: AnnouncementType;
    audience: AnnouncementAudience;
    classIds: string[];
    scheduledAt?: Date | null;
    expiresAt?: Date | null;
}

// ─── Date field row ───────────────────────────────────────────────────────────

interface DateFieldProps {
    label: string;
    value: Date | null | undefined;
    onSet: (date: Date) => void;
    onClear: () => void;
    minDate?: Date;
}

function DateField({ label, value, onSet, onClear, minDate }: DateFieldProps) {
    const [show, setShow] = useState(false);

    return (
        <View style={dateStyles.container}>
            <AppText variant="label" secondary style={dateStyles.label}>
                {label}
            </AppText>
            {value ? (
                <View style={dateStyles.valueRow}>
                    <TouchableOpacity
                        onPress={() => setShow(true)}
                        style={dateStyles.valueBtn}
                    >
                        <AppText variant="body2">{formatDate(value)}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onClear}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <AppText variant="body2" color={Colors.error}>✕</AppText>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    onPress={() => setShow(true)}
                    style={dateStyles.setBtn}
                >
                    <AppText variant="body2" color={Colors.primary}>＋ Set date</AppText>
                </TouchableOpacity>
            )}
            {show && (
                <DateTimePicker
                    value={value ?? new Date()}
                    mode="date"
                    minimumDate={minDate}
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(_, date) => {
                        setShow(Platform.OS === 'ios');
                        if (date) onSet(date);
                    }}
                />
            )}
        </View>
    );
}

const dateStyles = StyleSheet.create({
    container: { gap: Spacing[1] },
    label: {},
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
    valueBtn: {
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    setBtn: {
        alignSelf: 'flex-start',
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AnnouncementCreateScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const { data: classesData } = useGetMyClassesQuery();
    const classes = classesData?.data ?? [];

    const [createAnnouncement, { isLoading: isCreating }] =
        useCreateTeacherAnnouncementMutation();

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AnnouncementFormValues>({
        defaultValues: {
            title: '',
            body: '',
            type: 'GENERAL',
            audience: 'ALL',
            classIds: [],
            scheduledAt: null,
            expiresAt: null,
        },
    });

    const watchedType = watch('type');
    const watchedAudience = watch('audience');
    const watchedClassIds = watch('classIds');
    const watchedSchedule = watch('scheduledAt');
    const watchedExpiry = watch('expiresAt');

    const needsClassPicker = watchedAudience === 'SPECIFIC_CLASSES';

    // ─── Class toggle ──────────────────────────────────────────────────────
    const toggleClass = useCallback(
        (classId: string) => {
            const current = watchedClassIds;
            const updated = current.includes(classId)
                ? current.filter((id) => id !== classId)
                : [...current, classId];
            setValue('classIds', updated);
        },
        [watchedClassIds, setValue],
    );

    // ─── Submit ────────────────────────────────────────────────────────────
    const onSubmit = useCallback(
        async (values: AnnouncementFormValues) => {
            if (values.audience === 'SPECIFIC_CLASSES' && !values.classIds.length) {
                Alert.alert(
                    'Select Classes',
                    'Please select at least one class for this announcement.',
                );
                return;
            }

            try {
                await createAnnouncement({
                    title: values.title.trim(),
                    body: values.body.trim(),
                    type: values.type,
                    audience: values.audience,
                    classIds: values.audience === 'SPECIFIC_CLASSES' ? values.classIds : undefined,
                    scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
                    expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
                }).unwrap();

                dispatch(showSuccessToast('Announcement posted'));
                navigation.goBack();
            } catch (err: any) {
                const msg = err?.data?.message ?? 'Failed to post announcement';
                dispatch(showErrorToast(msg));
            }
        },
        [createAnnouncement, dispatch, navigation],
    );

    const typeColour = ANNOUNCEMENT_COLORS[watchedType]?.text ?? Colors.primary;

    return (
        <ScreenWrapper scrollable statusBar="teacher">

            <SectionHeader title="New Announcement" style={styles.pageHeader} />

            {/* ── Type selector ────────────────────────────────────────────── */}
            <AppText variant="label" secondary style={styles.fieldLabel}>
                Type
            </AppText>
            <View style={styles.typeGrid}>
                {TYPE_OPTIONS.map((opt) => {
                    const isSelected = watchedType === opt.value;
                    const cfg = ANNOUNCEMENT_COLORS[opt.value];
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => setValue('type', opt.value)}
                            style={[
                                styles.typeCard,
                                isSelected && {
                                    borderColor: cfg.text,
                                    backgroundColor: cfg.bg,
                                },
                            ]}
                            accessibilityRole="radio"
                            accessibilityLabel={opt.label}
                            accessibilityState={{ checked: isSelected }}
                        >
                            <AppText style={styles.typeEmoji}>{opt.emoji}</AppText>
                            <AppText
                                variant="label"
                                style={[styles.typeLabel, isSelected && { color: cfg.text }]}
                            >
                                {opt.label}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── Title ─────────────────────────────────────────────────────── */}
            <Controller
                control={control}
                name="title"
                rules={{ validate: composeValidators(required, maxLength(200)) }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <AppInput
                        ref={ref}
                        label="Title"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.title?.message}
                        placeholder="Brief, clear subject line…"
                        returnKeyType="next"
                        required
                        style={styles.field}
                    />
                )}
            />

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <Controller
                control={control}
                name="body"
                rules={{ validate: composeValidators(required, maxLength(4000)) }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <AppInput
                        ref={ref}
                        label="Message"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.body?.message}
                        placeholder="Write the full announcement here…"
                        multiline
                        numberOfLines={5}
                        required
                        style={styles.field}
                    />
                )}
            />

            {/* ── Audience ──────────────────────────────────────────────────── */}
            <AppText variant="label" secondary style={styles.fieldLabel}>
                Send to
            </AppText>
            <View style={styles.audienceRow}>
                {AUDIENCE_OPTIONS.map((opt) => (
                    <AppChip
                        key={opt.value}
                        label={opt.label}
                        selected={watchedAudience === opt.value}
                        onPress={() => setValue('audience', opt.value)}
                        size="sm"
                    />
                ))}
            </View>

            {/* ── Class picker (when SPECIFIC_CLASSES) ─────────────────────── */}
            {needsClassPicker && (
                <View style={styles.classPicker}>
                    <AppText variant="label" secondary style={styles.classPickerLabel}>
                        Select classes
                        {watchedClassIds.length > 0 && (
                            <AppText variant="label" color={Colors.primary}>
                                {' '}({watchedClassIds.length} selected)
                            </AppText>
                        )}
                    </AppText>
                    <View style={styles.classChips}>
                        {classes.map((cls) => (
                            <AppChip
                                key={cls.classId}
                                label={`${cls.name} ${cls.section}`}
                                selected={watchedClassIds.includes(cls.classId)}
                                onPress={() => toggleClass(cls.classId)}
                                size="sm"
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* ── Optional scheduling ───────────────────────────────────────── */}
            <AppText variant="label" secondary style={styles.fieldLabel}>
                Scheduling (optional)
            </AppText>
            <AppCard noPadding style={styles.scheduleCard}>
                <View style={styles.scheduleInner}>
                    <DateField
                        label="Publish at"
                        value={watchedSchedule}
                        onSet={(d) => setValue('scheduledAt', d)}
                        onClear={() => setValue('scheduledAt', null)}
                        minDate={new Date()}
                    />
                    <Divider style={styles.scheduleDivider} />
                    <DateField
                        label="Expires on"
                        value={watchedExpiry}
                        onSet={(d) => setValue('expiresAt', d)}
                        onClear={() => setValue('expiresAt', null)}
                        minDate={watchedSchedule ?? new Date()}
                    />
                </View>
            </AppCard>

            {/* ── Preview badge ─────────────────────────────────────────────── */}
            <AppText variant="label" secondary style={styles.fieldLabel}>
                Preview
            </AppText>
            <View style={styles.preview}>
                <AnnouncementTypeBadge type={watchedType} />
                <AppText variant="body2" secondary>
                    → {AUDIENCE_OPTIONS.find((o) => o.value === watchedAudience)?.desc ?? ''}
                    {needsClassPicker && watchedClassIds.length > 0
                        ? ` (${watchedClassIds.length} class${watchedClassIds.length > 1 ? 'es' : ''})`
                        : ''}
                </AppText>
            </View>

            <Spacer size={Spacing[6]} />

            {/* ── Submit ───────────────────────────────────────────────────── */}
            <AppButton
                label={isCreating ? 'Posting…' : 'Post Announcement'}
                onPress={handleSubmit(onSubmit)}
                loading={isCreating}
                fullWidth
            />

            <Spacer size={Spacing[10]} />
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    pageHeader: {
        marginBottom: Spacing[2],
        paddingTop: Spacing[4],
    },
    fieldLabel: {
        marginTop: Spacing[5],
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
        gap: Spacing[1],
    },
    typeEmoji: {
        fontSize: 22,
    },
    typeLabel: {
        fontSize: FontSize.xs,
        textAlign: 'center',
    },
    field: {
        marginTop: Spacing[4],
    },
    audienceRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    classPicker: {
        marginTop: Spacing[3],
        gap: Spacing[2],
    },
    classPickerLabel: {},
    classChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    scheduleCard: {
        overflow: 'hidden',
    },
    scheduleInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    scheduleDivider: {
        marginVertical: Spacing[1],
    },
    preview: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing[2],
        paddingVertical: Spacing[2],
    },
});