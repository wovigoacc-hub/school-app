// ─── Attendance status ────────────────────────────────────────────────────────

export type AttendanceStatus =
    | 'PRESENT'
    | 'ABSENT'
    | 'LATE'
    | 'LEAVE'
    | 'HALF_DAY';

// ─── Single attendance record ─────────────────────────────────────────────────

export interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    rollNumber?: string;
    status: AttendanceStatus;
    note?: string;
    date: string;
    subjectId?: string;
    subjectName?: string;
    isLocked: boolean;
    classId: string;
    className: string;
    section: string;
    createdAt: string;
}

// ─── Session (full class attendance for a date) ───────────────────────────────

export interface AttendanceSession {
    classId: string;
    className: string;
    section: string;
    subjectId?: string;
    subjectName?: string;
    date: string;
    isSubmitted: boolean;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    leaveCount: number;
    halfDayCount: number;
    records: AttendanceRecord[];
}

// ─── Submit attendance (teacher) ─────────────────────────────────────────────

export interface SubmitAttendanceRequest {
    classId: string;
    subjectId?: string;           // required for PERIOD_WISE
    date: string;           // "YYYY-MM-DD"
    records: AttendanceEntry[];
}

export interface AttendanceEntry {
    studentId: string;
    status: AttendanceStatus;
    note?: string;
}

// ─── Correction request ───────────────────────────────────────────────────────

export interface CorrectionRequest {
    attendanceId: string;
    requestedStatus: AttendanceStatus;
    reason: string;
}

// ─── Parent: today's status ───────────────────────────────────────────────────

export type TodayAttendanceStatus =
    | AttendanceStatus
    | 'NOT_MARKED';

export interface TodayAttendance {
    date: string;
    status: TodayAttendanceStatus;
    records: Array<{
        subjectName: string;
        status: AttendanceStatus;
        note?: string;
    }>;
}

// ─── Parent: attendance history ───────────────────────────────────────────────

export interface AttendanceHistory {
    studentId: string;
    studentName: string;
    className: string;
    section: string;
    totalDays: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    leaveCount: number;
    halfDayCount: number;
    attendancePct: number;
    thresholdPct: number;
    records: DailyAttendanceRecord[];
}

export interface DailyAttendanceRecord {
    id: string;
    date: string;
    status: AttendanceStatus;
    note?: string;
}

// ─── Local mark state (optimistic UI during session entry) ───────────────────

export interface LocalAttendanceMark {
    studentId: string;
    studentName: string;
    rollNumber?: string;
    photoUrl?: string;
    status: AttendanceStatus;
    note?: string;
    isLeave: boolean;         // auto-badged from approved leave
}