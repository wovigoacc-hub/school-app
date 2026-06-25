// ─── Event types ──────────────────────────────────────────────────────────────

export type DiaryEventType =
    | 'HOLIDAY'
    | 'HALF_DAY'
    | 'EXAM'
    | 'EVENT'
    | 'PARENT_MEETING'
    | 'SCHOOL_CLOSURE'
    | 'SPORTS'
    | 'CULTURAL'
    | 'FIELD_TRIP'
    | 'OTHER';

// ─── Event ────────────────────────────────────────────────────────────────────

export interface DiaryEvent {
    id: string;
    title: string;
    description?: string | null;
    type: DiaryEventType;
    startDate: string;       // ISO date string
    endDate: string;
    isFullDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
    affectsAttendance: boolean;
    isSchoolWide: boolean;
    color?: string | null;
    targetClasses: { id: string; name: string; section: string }[];
}

// ─── Calendar (published) ─────────────────────────────────────────────────────

export interface PublishedCalendar {
    id: string;
    name: string;
    description?: string | null;
    academicYear: { id: string; name: string };
    isPublished: boolean;
    events: DiaryEvent[];
}

// ─── API response ─────────────────────────────────────────────────────────────

export interface DiaryApiResponse {
    data: PublishedCalendar | null;
    message?: string;
}

// ─── Event type display config ────────────────────────────────────────────────

export const DIARY_EVENT_TYPE_CONFIG: Record<DiaryEventType, {
    label: string;
    color: string;
    bg: string;
}> = {
    HOLIDAY:       { label: 'Holiday',       color: '#16a34a', bg: '#f0fdf4' },
    HALF_DAY:      { label: 'Half Day',      color: '#ca8a04', bg: '#fefce8' },
    EXAM:          { label: 'Exam',          color: '#d97706', bg: '#fffbeb' },
    EVENT:         { label: 'Event',         color: '#9333ea', bg: '#faf5ff' },
    PARENT_MEETING:{ label: 'Parent Meeting',color: '#0891b2', bg: '#ecfeff' },
    SCHOOL_CLOSURE:{ label: 'School Closure',color: '#dc2626', bg: '#fef2f2' },
    SPORTS:        { label: 'Sports',        color: '#2563eb', bg: '#eff6ff' },
    CULTURAL:      { label: 'Cultural',      color: '#7c3aed', bg: '#f5f3ff' },
    FIELD_TRIP:    { label: 'Field Trip',    color: '#059669', bg: '#ecfdf5' },
    OTHER:         { label: 'Other',         color: '#6b7280', bg: '#f3f4f6' },
};
