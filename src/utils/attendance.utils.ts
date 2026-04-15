import type { AttendanceStatus, TodayAttendanceStatus } from '../types/attendance.types';

// ─── Status → display colour ──────────────────────────────────────────────────

export const ATTENDANCE_COLOURS: Record<AttendanceStatus, string> = {
    PRESENT: '#16a34a',   // green-600
    ABSENT: '#dc2626',   // red-600
    LATE: '#d97706',   // amber-600
    LEAVE: '#2563eb',   // blue-600
    HALF_DAY: '#9333ea',   // purple-600
};

export const ATTENDANCE_BG_COLOURS: Record<AttendanceStatus, string> = {
    PRESENT: '#dcfce7',   // green-100
    ABSENT: '#fee2e2',   // red-100
    LATE: '#fef3c7',   // amber-100
    LEAVE: '#dbeafe',   // blue-100
    HALF_DAY: '#f3e8ff',   // purple-100
};

export const ATTENDANCE_BORDER_COLOURS: Record<AttendanceStatus, string> = {
    PRESENT: '#86efac',
    ABSENT: '#fca5a5',
    LATE: '#fcd34d',
    LEAVE: '#93c5fd',
    HALF_DAY: '#d8b4fe',
};

// ─── Status → label text ──────────────────────────────────────────────────────

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    LEAVE: 'Leave',
    HALF_DAY: 'Half Day',
};

export const ATTENDANCE_LABELS_TAMIL: Record<AttendanceStatus, string> = {
    PRESENT: 'வந்தனர்',
    ABSENT: 'வரவில்லை',
    LATE: 'தாமதம்',
    LEAVE: 'விடுப்பு',
    HALF_DAY: 'அரை நாள்',
};

export const ATTENDANCE_LABELS_MALAYALAM: Record<AttendanceStatus, string> = {
    PRESENT: 'ഹാജർ',
    ABSENT: 'ഗൈർഹാജർ',
    LATE: 'വൈകി',
    LEAVE: 'ലീവ്',
    HALF_DAY: 'അർദ്ധ ദിവസം',
};

export function getAttendanceLabel(
    status: AttendanceStatus,
    locale?: string,
): string {
    if (locale === 'TAMIL') return ATTENDANCE_LABELS_TAMIL[status] ?? ATTENDANCE_LABELS[status];
    if (locale === 'MALAYALAM') return ATTENDANCE_LABELS_MALAYALAM[status] ?? ATTENDANCE_LABELS[status];
    return ATTENDANCE_LABELS[status];
}

// ─── Status → icon name (react-native-vector-icons / MaterialIcons) ──────────

export const ATTENDANCE_ICONS: Record<AttendanceStatus, string> = {
    PRESENT: 'check-circle',
    ABSENT: 'cancel',
    LATE: 'watch-later',
    LEAVE: 'event-note',
    HALF_DAY: 'timelapse',
};

// ─── Today status (includes NOT_MARKED) ──────────────────────────────────────

export const TODAY_STATUS_COLOURS: Record<TodayAttendanceStatus, string> = {
    PRESENT: '#16a34a',
    ABSENT: '#dc2626',
    LATE: '#d97706',
    LEAVE: '#2563eb',
    HALF_DAY: '#9333ea',
    NOT_MARKED: '#9ca3af',
};

export const TODAY_STATUS_LABELS: Record<TodayAttendanceStatus, string> = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    LEAVE: 'Leave',
    HALF_DAY: 'Half Day',
    NOT_MARKED: 'Not Marked',
};

// ─── Tap order for attendance marking UI ─────────────────────────────────────
// When teacher taps a student row, this is the cycle order

export const STATUS_CYCLE_ORDER: AttendanceStatus[] = [
    'PRESENT',
    'ABSENT',
    'LATE',
    'LEAVE',
    'HALF_DAY',
];

export function cycleStatus(current: AttendanceStatus): AttendanceStatus {
    const index = STATUS_CYCLE_ORDER.indexOf(current);
    return STATUS_CYCLE_ORDER[(index + 1) % STATUS_CYCLE_ORDER.length];
}

// ─── Attendance threshold helpers ─────────────────────────────────────────────

/**
 * Attendance percentage → colour indicator
 * ≥ threshold = green, within 5% = amber, below = red
 */
export function attendancePctColour(
    pct: number,
    thresholdPct: number,
): string {
    if (pct >= thresholdPct) return '#16a34a'; // green — safe
    if (pct >= thresholdPct - 5) return '#d97706'; // amber — warning
    return '#dc2626';                                    // red   — critical
}

/**
 * true if student is at risk (below threshold)
 */
export function isBelowThreshold(
    pct: number,
    thresholdPct: number,
): boolean {
    return pct < thresholdPct;
}

// ─── Session summary helpers ──────────────────────────────────────────────────

export interface SessionCounts {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    LEAVE: number;
    HALF_DAY: number;
    total: number;
}

export function countStatuses(
    statuses: AttendanceStatus[],
): SessionCounts {
    const counts: SessionCounts = {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        LEAVE: 0,
        HALF_DAY: 0,
        total: statuses.length,
    };
    for (const s of statuses) {
        counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
}

export function sessionAttendancePct(counts: SessionCounts): number {
    if (counts.total === 0) return 100;
    return Math.round((counts.PRESENT / counts.total) * 100);
}

// ─── Calendar dot colours (react-native-calendars markedDates) ───────────────

export function toCalendarDot(status: AttendanceStatus): { key: string; color: string } {
    return { key: status, color: ATTENDANCE_COLOURS[status] };
}

/**
 * Build markedDates object for react-native-calendars
 * Input: array of { date: "YYYY-MM-DD", status: AttendanceStatus }
 */
export function buildCalendarMarks(
    records: Array<{ date: string; status: AttendanceStatus }>,
): Record<string, { dots?: Array<{ key: string; color: string }>; selected?: boolean }> {
    const marks: Record<string, { dots: Array<{ key: string; color: string }> }> = {};

    for (const record of records) {
        const dot = toCalendarDot(record.status);
        if (!marks[record.date]) {
            marks[record.date] = { dots: [dot] };
        } else {
            marks[record.date].dots.push(dot);
        }
    }

    return marks;
}