import React, { useCallback, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
    type TextInput as TextInputType,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, HitSlop } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import type { LocalMarkEntry } from '../../types/mark.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MarkInputRowProps {
    entry: LocalMarkEntry;
    maxMarks: number;
    /** Called when marks text changes (raw string — parsed before submit) */
    onMarksChange: (studentId: string, value: string) => void;
    /** Called when absent toggle changes */
    onAbsentToggle: (studentId: string, isAbsent: boolean) => void;
    /** Called when remarks change */
    onRemarksChange?: (studentId: string, value: string) => void;
    /** Whether mark entry is still open */
    editable?: boolean;
    /** Pass focus to next row on submit */
    onSubmitEditing?: () => void;
    showRollNumber?: boolean;
    style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MarkInputRow({
    entry,
    maxMarks,
    onMarksChange,
    onAbsentToggle,
    onRemarksChange,
    editable = true,
    onSubmitEditing,
    showRollNumber = true,
    style,
}: MarkInputRowProps) {
    const {
        studentId,
        studentName,
        rollNumber,
        marksObtained,
        isAbsent,
        teacherRemarks,
        hasError,
        errorMessage,
    } = entry;

    const inputRef = useRef<TextInputType>(null);

    const handleAbsentToggle = useCallback(() => {
        onAbsentToggle(studentId, !isAbsent);
        if (!isAbsent) {
            // Clearing marks when marking absent
            onMarksChange(studentId, '');
        }
    }, [studentId, isAbsent, onAbsentToggle, onMarksChange]);

    const handleMarksChange = useCallback(
        (text: string) => {
            // Allow only numbers and one decimal point
            const cleaned = text.replace(/[^0-9.]/g, '');
            onMarksChange(studentId, cleaned);
        },
        [studentId, onMarksChange],
    );

    const inputBorderColor = hasError
        ? Colors.error
        : isAbsent
            ? Colors.border
            : marksObtained && Number(marksObtained) > 0
                ? Colors.success
                : Colors.inputBorder;

    return (
        <View
            style={[
                styles.row,
                isAbsent && styles.rowAbsent,
                hasError && styles.rowError,
                style,
            ]}
        >
            {/* Roll number */}
            {showRollNumber && (
                <AppText variant="caption" tertiary style={styles.roll} numberOfLines={1}>
                    {rollNumber ?? '—'}
                </AppText>
            )}

            {/* Avatar */}
            <AppAvatar
                firstName={studentName.split(' ')[0]}
                lastName={studentName.split(' ')[1]}
                size="sm"
                style={styles.avatar}
            />

            {/* Name */}
            <View style={styles.nameBlock}>
                <AppText
                    variant="body2"
                    numberOfLines={1}
                    style={[styles.name, isAbsent && styles.nameAbsent]}
                >
                    {studentName}
                </AppText>
                {hasError && errorMessage && (
                    <AppText style={styles.errorText} numberOfLines={1}>
                        {errorMessage}
                    </AppText>
                )}
            </View>

            {/* Absent toggle */}
            <TouchableOpacity
                onPress={handleAbsentToggle}
                disabled={!editable}
                style={[styles.absentToggle, isAbsent && styles.absentToggleActive]}
                hitSlop={HitSlop.sm}
                accessibilityRole="checkbox"
                accessibilityLabel="Mark as absent"
                accessibilityState={{ checked: isAbsent }}
            >
                <AppText style={[styles.absentText, isAbsent && styles.absentTextActive]}>
                    {isAbsent ? 'AB' : 'AB'}
                </AppText>
            </TouchableOpacity>

            {/* Marks input */}
            <View
                style={[
                    styles.inputWrapper,
                    { borderColor: inputBorderColor },
                    isAbsent && styles.inputWrapperDisabled,
                ]}
            >
                <TextInput
                    ref={inputRef}
                    value={marksObtained}
                    onChangeText={handleMarksChange}
                    onSubmitEditing={onSubmitEditing}
                    editable={editable && !isAbsent}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    selectTextOnFocus
                    placeholder="—"
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={[
                        styles.input,
                        isAbsent && styles.inputDisabled,
                        hasError && styles.inputError,
                    ]}
                    maxLength={6}
                    accessibilityLabel={`Marks for ${studentName}`}
                    accessibilityHint={`Enter marks out of ${maxMarks}`}
                />
                <AppText style={styles.maxMarks}>/{maxMarks}</AppText>
            </View>
        </View>
    );
}

// ─── Mark sheet header (column labels) ───────────────────────────────────────

interface MarkSheetHeaderProps {
    examName: string;
    subjectName: string;
    maxMarks: number;
    className: string;
    section: string;
    enteredCount: number;
    totalCount: number;
    style?: StyleProp<ViewStyle>;
}

export function MarkSheetHeader({
    examName,
    subjectName,
    maxMarks,
    className,
    section,
    enteredCount,
    totalCount,
    style,
}: MarkSheetHeaderProps) {
    const pct = totalCount > 0 ? Math.round((enteredCount / totalCount) * 100) : 0;

    return (
        <View style={[styles.sheetHeader, style]}>
            <View style={styles.sheetHeaderLeft}>
                <AppText variant="subtitle1" numberOfLines={1}>
                    {subjectName}
                </AppText>
                <AppText variant="body2" secondary>
                    {examName} · {className} {section} · Max: {maxMarks}
                </AppText>
            </View>
            <View style={styles.sheetHeaderRight}>
                <AppText variant="numeric" style={styles.enteredCount}>
                    {enteredCount}/{totalCount}
                </AppText>
                <AppText variant="caption" tertiary>
                    {pct}% entered
                </AppText>
            </View>
        </View>
    );
}

// ─── Column header row ────────────────────────────────────────────────────────

export function MarkColumnHeader({ style }: { style?: StyleProp<ViewStyle> }) {
    return (
        <View style={[styles.columnHeader, style]}>
            <AppText style={[styles.columnText, styles.columnRoll]}>#</AppText>
            <AppText style={[styles.columnText, styles.columnName]}>Student</AppText>
            <AppText style={[styles.columnText, styles.columnAbsent]}>AB</AppText>
            <AppText style={[styles.columnText, styles.columnMarks]}>Marks</AppText>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT_WIDTH = 80;
const ABSENT_WIDTH = 36;
const ROW_HEIGHT = 56;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: ROW_HEIGHT,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    rowAbsent: {
        backgroundColor: Colors.surfaceSecondary,
    },
    rowError: {
        backgroundColor: '#fff8f8',
    },
    roll: {
        width: 28,
        textAlign: 'right',
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    avatar: {
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    nameBlock: {
        flex: 1,
        marginRight: Spacing[2],
    },
    name: {
        fontSize: FontSize.sm,
    },
    nameAbsent: {
        color: Colors.textTertiary,
    },
    errorText: {
        fontSize: 10,
        color: Colors.error,
        marginTop: 2,
    },
    absentToggle: {
        width: ABSENT_WIDTH,
        height: 28,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[2],
        flexShrink: 0,
    },
    absentToggleActive: {
        backgroundColor: Colors.errorLight,
        borderColor: Colors.error,
    },
    absentText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        color: Colors.textTertiary,
    },
    absentTextActive: {
        color: Colors.error,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: INPUT_WIDTH,
        height: 36,
        borderWidth: 1.5,
        borderRadius: BorderRadius.md,
        paddingLeft: Spacing[2],
        paddingRight: Spacing[1],
        flexShrink: 0,
        backgroundColor: Colors.inputBg,
    },
    inputWrapperDisabled: {
        backgroundColor: Colors.surfaceSecondary,
        borderColor: Colors.border,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: FontSize.base,
        fontWeight: FontWeight.semiBold,
        color: Colors.inputText,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        includeFontPadding: false,
    },
    inputDisabled: {
        color: Colors.textTertiary,
    },
    inputError: {
        color: Colors.error,
    },
    maxMarks: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        flexShrink: 0,
    },
    // ── Sheet header ─────────────────────────────────────────────────────────
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    sheetHeaderLeft: {
        flex: 1,
        gap: 2,
    },
    sheetHeaderRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    enteredCount: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
    },
    // ── Column header ─────────────────────────────────────────────────────────
    columnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        backgroundColor: Colors.surfaceSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    columnText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.textTertiary,
        textTransform: 'uppercase',
    },
    columnRoll: { width: 28 + Spacing[2], textAlign: 'right' },
    columnName: { flex: 1, marginLeft: 32 + Spacing[2] },
    columnAbsent: { width: ABSENT_WIDTH + Spacing[2], textAlign: 'center' },
    columnMarks: { width: INPUT_WIDTH, textAlign: 'center' },
});