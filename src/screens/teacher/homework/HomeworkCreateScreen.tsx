import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { AppCard } from '../../../components/common/AppCard';
import { AppChip } from '../../../components/common/AppChip';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import {
    useCreateHomeworkMutation,
    useUpdateHomeworkMutation,
    useGetHomeworkDetailQuery,
} from '../../../services/teacher/homework.service';
import {
    required,
    maxLength,
    composeValidators,
} from '../../../utils/validation.utils';
import { toISODate, formatDate } from '../../../utils/date.utils';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'HomeworkCreate'
>['route'];
type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Form values ──────────────────────────────────────────────────────────────

interface HomeworkFormValues {
    title: string;
    instructions: string;
    classId: string;
    subjectId: string;
    dueDate: Date;
    isGraded: boolean;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeworkCreateScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const prefillClassId = route.params?.classId;
    const prefillSubjectId = route.params?.subjectId;

    const { data: classesData, isLoading: classesLoading } = useGetMyClassesQuery();
    const classes = classesData?.data ?? [];

    const [createHomework, { isLoading: isCreating }] = useCreateHomeworkMutation();

    // ─── Date picker state ────────────────────────────────────────────────────
    const [showDatePicker, setShowDatePicker] = useState(false);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<HomeworkFormValues>({
        defaultValues: {
            title: '',
            instructions: '',
            classId: prefillClassId ?? '',
            subjectId: prefillSubjectId ?? '',
            dueDate: tomorrow,
            isGraded: false,
        },
    });

    const watchedClassId = watch('classId');
    const watchedDueDate = watch('dueDate');
    const watchedIsGraded = watch('isGraded');

    // Subjects for the selected class
    const selectedClass = classes.find((c) => c.classId === watchedClassId);
    const subjects = selectedClass?.mySubjects ?? [];

    const onSubmit = useCallback(
        async (values: HomeworkFormValues) => {
            try {
                const result = await createHomework({
                    classId: values.classId,
                    subjectId: values.subjectId,
                    title: values.title.trim(),
                    instructions: values.instructions.trim() || undefined,
                    dueDate: toISODate(values.dueDate),
                    isGraded: values.isGraded,
                }).unwrap();

                dispatch(showSuccessToast('Homework assigned'));
                navigation.replace('HomeworkDetail', {
                    homeworkId: result.data.id,
                });
            } catch (err: any) {
                const msg = err?.data?.message ?? 'Failed to create homework';
                dispatch(showErrorToast(msg));
            }
        },
        [createHomework, dispatch, navigation],
    );

    return (
        <ScreenWrapper scrollable statusBar="teacher">
            <SectionHeader title="Assign Homework" style={styles.pageHeader} />

            {/* Class picker */}
            <AppText variant="label" style={styles.fieldLabel}>
                Class <AppText variant="label" color={Colors.error}>*</AppText>
            </AppText>
            <Controller
                control={control}
                name="classId"
                rules={{ validate: (v) => !!v || 'Select a class' }}
                render={({ field: { value, onChange } }) => (
                    <>
                        <View style={styles.chipRow}>
                            {classesLoading ? (
                                <AppText variant="caption" secondary>Loading classes…</AppText>
                            ) : (
                                classes.map((cls) => (
                                    <AppChip
                                        key={cls.classId}
                                        label={`${cls.name} ${cls.section}`}
                                        selected={value === cls.classId}
                                        onPress={() => {
                                            onChange(cls.classId);
                                            setValue('subjectId', ''); // reset subject on class change
                                        }}
                                        size="sm"
                                    />
                                ))
                            )}
                        </View>
                        {errors.classId && (
                            <AppText variant="caption" color={Colors.error} style={styles.fieldError}>
                                {errors.classId.message}
                            </AppText>
                        )}
                    </>
                )}
            />

            {/* Subject picker — only when class selected */}
            {watchedClassId && subjects.length > 0 && (
                <>
                    <AppText variant="label" style={styles.fieldLabel}>
                        Subject <AppText variant="label" color={Colors.error}>*</AppText>
                    </AppText>
                    <Controller
                        control={control}
                        name="subjectId"
                        rules={{ validate: (v) => !!v || 'Select a subject' }}
                        render={({ field: { value, onChange } }) => (
                            <>
                                <View style={styles.chipRow}>
                                    {subjects.map((subj) => (
                                        <AppChip
                                            key={subj.subjectId}
                                            label={subj.subjectName}
                                            selected={value === subj.subjectId}
                                            onPress={() => onChange(subj.subjectId)}
                                            size="sm"
                                        />
                                    ))}
                                </View>
                                {errors.subjectId && (
                                    <AppText variant="caption" color={Colors.error} style={styles.fieldError}>
                                        {errors.subjectId.message}
                                    </AppText>
                                )}
                            </>
                        )}
                    />
                </>
            )}

            {/* Title */}
            <Controller
                control={control}
                name="title"
                rules={{ validate: composeValidators(required, maxLength(200)) }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <AppInput
                        ref={ref}
                        label="Homework title"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.title?.message}
                        placeholder="e.g. Chapter 5 — Exercises 1-10"
                        returnKeyType="next"
                        required
                        style={styles.field}
                    />
                )}
            />

            {/* Instructions */}
            <Controller
                control={control}
                name="instructions"
                rules={{ validate: maxLength(2000) }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <AppInput
                        ref={ref}
                        label="Instructions (optional)"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.instructions?.message}
                        placeholder="Additional instructions for students…"
                        multiline
                        numberOfLines={3}
                        style={styles.field}
                    />
                )}
            />

            {/* Due date */}
            <AppText variant="label" style={styles.fieldLabel}>
                Due date <AppText variant="label" color={Colors.error}>*</AppText>
            </AppText>
            <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePicker}
                accessibilityRole="button"
                accessibilityLabel="Select due date"
            >
                <AppText variant="body1">📅 {formatDate(watchedDueDate)}</AppText>
                <AppText secondary style={styles.dateChevron}>›</AppText>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={watchedDueDate}
                    mode="date"
                    minimumDate={tomorrow}
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) setValue('dueDate', date);
                    }}
                />
            )}

            {/* Graded toggle */}
            <AppCard
                onPress={() => setValue('isGraded', !watchedIsGraded)}
                style={styles.toggleCard}
                noPadding
            >
                <View style={styles.toggleRow}>
                    <View>
                        <AppText variant="subtitle2">Graded assignment</AppText>
                        <AppText variant="caption" secondary>
                            You will enter marks after students submit
                        </AppText>
                    </View>
                    <View style={[styles.toggle, watchedIsGraded && styles.toggleOn]}>
                        <View style={[styles.toggleKnob, watchedIsGraded && styles.toggleKnobOn]} />
                    </View>
                </View>
            </AppCard>

            <Spacer size={Spacing[6]} />

            {/* Submit */}
            <AppButton
                label={isCreating ? 'Assigning…' : 'Assign Homework'}
                onPress={handleSubmit(onSubmit)}
                loading={isCreating}
                fullWidth
                style={styles.submitBtn}
            />

            <Spacer size={Spacing[8]} />
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    pageHeader: {
        marginBottom: Spacing[2],
    },
    fieldLabel: {
        marginTop: Spacing[4],
        marginBottom: Spacing[2],
    },
    fieldError: {
        marginTop: Spacing[1],
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },
    field: {
        marginTop: Spacing[4],
    },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        paddingHorizontal: Spacing[4],
        height: 52,
    },
    dateChevron: {
        fontSize: FontSize.xl,
    },
    toggleCard: {
        marginTop: Spacing[4],
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing[4],
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleOn: {
        backgroundColor: Colors.primary,
    },
    toggleKnob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.white,
        alignSelf: 'flex-start',
    },
    toggleKnobOn: {
        alignSelf: 'flex-end',
    },
    submitBtn: {
        marginTop: Spacing[2],
    },
});