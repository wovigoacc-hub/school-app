import React, {
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import {
    View,
    FlatList,
    TextInput,
    Alert,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { AppText } from '../../../components/common/AppText';
import { AppButton } from '../../../components/common/AppButton';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { PresetEmptyState } from '../../../components/common/AppEmptyState';
import { SkeletonList } from '../../../components/common/AppSkeleton';
import {
    MarkInputRow,
    MarkSheetHeader,
    MarkColumnHeader,
} from '../../../components/marks/MarkInputRow';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
import {
    useGetMarkSheetQuery,
    useSubmitMarksMutation,
} from '../../../services/teacher/marks.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import { validMark } from '../../../utils/validation.utils';
import type { LocalMarkEntry } from '../../../types/mark.types';
import type { TeacherNavigatorParamList } from '../../../navigation/types';

type RouteProps = NativeStackScreenProps<
    TeacherNavigatorParamList,
    'MarkEntry'
>['route'];
type Nav = NativeStackNavigationProp<TeacherNavigatorParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MarkSheetScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const {
        examId, examName, subjectId, subjectName,
        classId, className, section, maxMarks,
    } = route.params;

    const {
        data: sheetData,
        isLoading,
        refetch,
    } = useGetMarkSheetQuery({ examId, subjectId, classId });

    const [submitMarks, { isLoading: isSubmitting }] = useSubmitMarksMutation();
    const sheet = sheetData?.data;

    // ─── Local entries state ─────────────────────────────────────────────────
    const [entries, setEntries] = useState<LocalMarkEntry[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Track TextInput refs for focus management
    const inputRefs = useRef<Map<string, TextInput>>(new Map());

    // Hydrate entries from server sheet on load
    useEffect(() => {
        if (!sheet?.marks?.length) return;
        setEntries(
            sheet.marks.map((m) => ({
                studentId: m.studentId,
                studentName: m.studentName,
                rollNumber: m.rollNumber,
                marksObtained: m.marksObtained != null ? String(m.marksObtained) : '',
                isAbsent: m.isAbsent,
                teacherRemarks: m.teacherRemarks ?? '',
                hasError: false,
                errorMessage: undefined,
            })),
        );
        setIsDirty(false);
    }, [sheet?.marks]);

    const { refreshing, onRefresh } = useRefresh(refetch);

    // ─── Entry handlers ──────────────────────────────────────────────────────

    const handleMarksChange = useCallback(
        (studentId: string, value: string) => {
            setEntries((prev) =>
                prev.map((e) => {
                    if (e.studentId !== studentId) return e;
                    const error = validMark(maxMarks)(value);
                    return {
                        ...e,
                        marksObtained: value,
                        hasError: error !== true,
                        errorMessage: error !== true ? (error as string) : undefined,
                    };
                }),
            );
            setIsDirty(true);
        },
        [maxMarks],
    );

    const handleAbsentToggle = useCallback(
        (studentId: string, isAbsent: boolean) => {
            setEntries((prev) =>
                prev.map((e) =>
                    e.studentId === studentId
                        ? { ...e, isAbsent, marksObtained: '', hasError: false, errorMessage: undefined }
                        : e,
                ),
            );
            setIsDirty(true);
        },
        [],
    );

    // Focus the next row's input after pressing "next" on keyboard
    const handleFocusNext = useCallback(
        (currentStudentId: string) => {
            const idx = entries.findIndex((e) => e.studentId === currentStudentId);
            const next = entries[idx + 1];
            if (!next) return;
            // Skip absent rows
            const target = entries.slice(idx + 1).find((e) => !e.isAbsent);
            if (target) {
                inputRefs.current.get(target.studentId)?.focus();
            }
        },
        [entries],
    );

    // ─── Validation ──────────────────────────────────────────────────────────

    const validateAll = useCallback((): boolean => {
        let hasErrors = false;
        const validated = entries.map((e) => {
            if (e.isAbsent) return { ...e, hasError: false, errorMessage: undefined };
            const error = validMark(maxMarks)(e.marksObtained);
            if (error !== true) {
                hasErrors = true;
                return { ...e, hasError: true, errorMessage: error as string };
            }
            return { ...e, hasError: false, errorMessage: undefined };
        });
        if (hasErrors) setEntries(validated);
        return !hasErrors;
    }, [entries, maxMarks]);

    // ─── Outlier detection ────────────────────────────────────────────────────

    const outlierWarnings = useMemo(() => {
        const values = entries
            .filter((e) => !e.isAbsent && e.marksObtained !== '')
            .map((e) => parseFloat(e.marksObtained));

        if (values.length < 3) return [];

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const threshold = maxMarks * 0.1; // flag if > 10% of maxMarks from average

        return entries
            .filter((e) => {
                if (e.isAbsent || e.marksObtained === '') return false;
                const val = parseFloat(e.marksObtained);
                return Math.abs(val - avg) > threshold && val < avg * 0.5;
            })
            .map((e) => e.studentName);
    }, [entries, maxMarks]);

    // ─── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(
        async (action: 'DRAFT' | 'SUBMITTED') => {
            if (action === 'SUBMITTED' && !validateAll()) {
                dispatch(showErrorToast('Please fix errors before submitting'));
                return;
            }

            const proceed = async () => {
                try {
                    const result = await submitMarks({
                        examId,
                        subjectId,
                        classId,
                        action,
                        marks: entries.map((e) => ({
                            studentId: e.studentId,
                            marksObtained: e.isAbsent || e.marksObtained === ''
                                ? null
                                : parseFloat(e.marksObtained),
                            isAbsent: e.isAbsent,
                            teacherRemarks: e.teacherRemarks || undefined,
                        })),
                    }).unwrap();

                    setIsDirty(false);

                    if (action === 'SUBMITTED') {
                        dispatch(showSuccessToast('Marks submitted successfully'));
                        navigation.goBack();
                    } else {
                        dispatch(showSuccessToast('Draft saved'));
                    }
                } catch (err: any) {
                    const msg = err?.data?.message ?? 'Failed to save marks';
                    dispatch(showErrorToast(msg));
                }
            };

            // Show outlier warning before final submit
            if (action === 'SUBMITTED' && outlierWarnings.length > 0) {
                Alert.alert(
                    'Possible Outliers',
                    `These students have unusually low marks:\n${outlierWarnings.join('\n')}\n\nProceed with submission?`,
                    [
                        { text: 'Review', style: 'cancel' },
                        { text: 'Submit', onPress: proceed },
                    ],
                );
                return;
            }

            await proceed();
        },
        [
            validateAll, submitMarks, entries,
            examId, subjectId, classId,
            dispatch, navigation, outlierWarnings,
        ],
    );

    // ─── Progress stats ───────────────────────────────────────────────────────

    const enteredCount = entries.filter(
        (e) => e.isAbsent || e.marksObtained !== '',
    ).length;

    const hasErrors = entries.some((e) => e.hasError);

    // ─── Render ──────────────────────────────────────────────────────────────

    const renderItem: ListRenderItem<LocalMarkEntry> = useCallback(
        ({ item, index }) => (
            <MarkInputRow
                entry={item}
                maxMarks={maxMarks}
                onMarksChange={handleMarksChange}
                onAbsentToggle={handleAbsentToggle}
                editable
                onSubmitEditing={() => handleFocusNext(item.studentId)}
                showRollNumber
            />
        ),
        [maxMarks, handleMarksChange, handleAbsentToggle, handleFocusNext],
    );

    if (isLoading) {
        return <ScreenWrapper loading statusBar="teacher" />;
    }

    return (
        <ScreenWrapper noKeyboard noPadding statusBar="teacher">
            <FlatList
                data={entries}
                keyExtractor={(item) => item.studentId}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View>
                        <MarkSheetHeader
                            examName={examName}
                            subjectName={subjectName}
                            maxMarks={maxMarks}
                            className={className}
                            section={section}
                            enteredCount={enteredCount}
                            totalCount={entries.length}
                        />
                        {/* Error banner */}
                        {hasErrors && (
                            <View style={styles.errorBanner}>
                                <AppText style={styles.errorBannerText}>
                                    ⚠️ Some entries have errors — fix before submitting
                                </AppText>
                            </View>
                        )}
                        <MarkColumnHeader />
                    </View>
                }
                ListEmptyComponent={
                    <PresetEmptyState
                        preset="search"
                        title="No students"
                        message="No students found in this class."
                        compact
                    />
                }
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={false}  // keep inputs mounted for focus management
                maxToRenderPerBatch={15}
                windowSize={10}
            />

            {/* Fixed submit bar */}
            <View style={styles.submitBar}>
                <View style={styles.submitBarLeft}>
                    <AppText variant="subtitle2">
                        {enteredCount}/{entries.length}
                    </AppText>
                    <AppText variant="caption" secondary>entered</AppText>
                </View>

                <View style={styles.submitBtns}>
                    {/* Save draft */}
                    <AppButton
                        label="Save Draft"
                        variant="secondary"
                        size="sm"
                        loading={isSubmitting}
                        onPress={() => handleSubmit('DRAFT')}
                        style={styles.draftBtn}
                    />
                    {/* Final submit */}
                    <AppButton
                        label="Submit"
                        variant="primary"
                        size="sm"
                        loading={isSubmitting}
                        disabled={hasErrors || enteredCount === 0}
                        onPress={() => handleSubmit('SUBMITTED')}
                        style={styles.submitBtn}
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    list: {
        paddingBottom: Spacing[10] + 72,  // clear fixed submit bar
    },
    errorBanner: {
        backgroundColor: Colors.errorLight,
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[2],
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.errorBorder,
    },
    errorBannerText: {
        fontSize: FontSize.sm,
        color: Colors.error,
        fontWeight: FontWeight.medium,
    },
    submitBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    submitBarLeft: {
        gap: 2,
    },
    submitBtns: {
        flexDirection: 'row',
        gap: Spacing[3],
        alignItems: 'center',
    },
    draftBtn: {
        minWidth: 96,
    },
    submitBtn: {
        minWidth: 96,
    },
});