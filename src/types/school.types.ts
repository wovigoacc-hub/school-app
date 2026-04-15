// ─── School (read-only view for mobile users) ────────────────────────────────
// Teachers and parents see a subset of school info

export interface School {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    attendanceMode: AttendanceMode;
    attendanceLockTime: string;    // "HH:mm" e.g. "17:00"
    attendanceThresholdPct: number;    // e.g. 75
    globalPassMarkPct: number;    // e.g. 35
}

// ─── Attendance mode ─────────────────────────────────────────────────────────

export type AttendanceMode = 'ONCE_DAILY' | 'PERIOD_WISE';

// ─── Academic year ────────────────────────────────────────────────────────────

export interface AcademicYear {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    isArchived: boolean;
}