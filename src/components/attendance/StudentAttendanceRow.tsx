import React, { useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import {
    cycleStatus,
    ATTENDANCE_COLOURS,
    ATTENDANCE_BG_COLOURS,
    STATUS_CYCLE_ORDER,
} from '../../utils/attendance.utils';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, AvatarSize, HitSlop } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import type {
    AttendanceStatus,
    LocalAttendanceMark,
} from '../../types/attendance.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentAttendanceRowProps {
    mark: LocalAttendanceMark;
    /** Called whenever the status changes */
    onChange: (studentId: string, status: AttendanceStatus) => void;
    /** Lock — post-locktime, read-only */
    locked?: boolean;
    /** Show roll number */
    showRoll?: boolean;
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentAttendanceRow({
    mark,
    onChange,
    locked = false,
    showRoll = true,
    style,
}: StudentAttendanceRowProps) {
    const { studentId, studentName, rollNumber, photoUrl, status, isLeave } = mark;

    // Tap anywhere on the row to cycle the status
    const handleRowTap = useCallback(() => {
        if (locked || isLeave) return;
        const next = cycleStatus(status);
        onChange(studentId, next);
    }, [locked, isLeave, status, studentId, onChange]);

    // Individual status button tap — jump directly to that status
    const handleStatusTap = useCallback(
        (s: AttendanceStatus) => {
            if (locked || isLeave) return;
            onChange(studentId, s);
        },
        [locked, isLeave, studentId, onChange],
    );

    const isAbsent = status === 'ABSENT';

    return (
        <TouchableOpacity
            activeOpacity={locked || isLeave ? 1 : 0.75}
            onPress={handleRowTap}
            disabled={locked || isLeave}
            style={[
                styles.row,
                isAbsent && styles.rowAbsent,
                isLeave && styles.rowLeave,
                style,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${studentName}, ${status}`}
            accessibilityHint={
                locked ? 'Attendance is locked' :
                    isLeave ? 'Leave approved — cannot change' :
                        'Tap to cycle status'
            }
        >
            {/* Roll number */}
            {showRoll && (
                <AppText
                    variant="caption"
                    tertiary
                    style={styles.roll}
                    numberOfLines={1}
                >
                    {rollNumber ?? '—'}
                </AppText>
            )}

            {/* Avatar */}
            <AppAvatar
                firstName={studentName.split(' ')[0]}
                lastName={studentName.split(' ')[1]}
                photoUrl={photoUrl}
                size="sm"
                style={styles.avatar}
            />

            {/* Name */}
            <AppText
                variant="body2"
                style={[styles.name, isAbsent && styles.nameAbsent]}
                numberOfLines={1}
            >
                {studentName}
            </AppText>

            {/* Leave badge — overrides status buttons */}
            {isLeave ? (
                <View style={styles.leavePill}>
                    <AppText style={styles.leaveText}>Leave</AppText>
                </View>
            ) : locked ? (
                /* Locked — show badge only, no buttons */
                <AttendanceStatusBadge status={status} compact />
            ) : (
                /* Status toggle buttons */
                <StatusButtonRow
                    selected={status}
                    onSelect={handleStatusTap}
                />
            )}
        </TouchableOpacity>
    );
}

// ─── Status button row ────────────────────────────────────────────────────────

interface StatusButtonRowProps {
    selected: AttendanceStatus;
    onSelect: (status: AttendanceStatus) => void;
}

function StatusButtonRow({ selected, onSelect }: StatusButtonRowProps) {
    return (
        <View style={styles.statusButtons}>
            {STATUS_CYCLE_ORDER.map((s) => {
                const isActive = selected === s;
                return (
                    <TouchableOpacity
                        key={s}
                        onPress={() => onSelect(s)}
                        style={[
                            styles.statusBtn,
                            isActive
                                ? { backgroundColor: ATTENDANCE_COLOURS[s] }
                                : { backgroundColor: ATTENDANCE_BG_COLOURS[s], opacity: 0.5 },
                        ]}
                        hitSlop={HitSlop.sm}
                        accessibilityRole="radio"
                        accessibilityLabel={s.charAt(0) + s.slice(1).toLowerCase()}
                        accessibilityState={{ checked: isActive }}
                    >
                        <AppText
                            style={[
                                styles.statusBtnText,
                                { color: isActive ? Colors.white : ATTENDANCE_COLOURS[s] },
                            ]}
                        >
                            {STATUS_ABBREV[s]}
                        </AppText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// Short labels for the compact toggle buttons
const STATUS_ABBREV: Record<AttendanceStatus, string> = {
    PRESENT: 'P',
    ABSENT: 'A',
    LATE: 'L',
    LEAVE: 'Lv',
    HALF_DAY: 'H',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 56;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        height: ROW_HEIGHT,
        paddingHorizontal: Spacing[4],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    rowAbsent: {
        backgroundColor: '#fff5f5',
    },
    rowLeave: {
        backgroundColor: '#eff6ff',
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
    name: {
        flex: 1,
        fontSize: FontSize.sm,
    },
    nameAbsent: {
        color: Colors.textTertiary,
    },
    leavePill: {
        backgroundColor: Colors.leaveBg,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: 4,
    },
    leaveText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold,
        color: Colors.leave,
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 4,
        flexShrink: 0,
    },
    statusBtn: {
        width: 28,
        height: 28,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBtnText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
    },
});