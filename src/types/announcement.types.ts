// ─── Announcement type ────────────────────────────────────────────────────────

export type AnnouncementType =
    | 'GENERAL'
    | 'CIRCULAR'
    | 'HOLIDAY'
    | 'EVENT'
    | 'EXAM_SCHEDULE'
    | 'PARENT_MEETING'
    | 'EMERGENCY';

export type AnnouncementAudience =
    | 'ALL'
    | 'PARENTS'
    | 'TEACHERS'
    | 'SPECIFIC_CLASSES';

// ─── Announcement (feed item — includes isRead) ───────────────────────────────

export interface Announcement {
    id: string;
    schoolId: string;
    title: string;
    body: string;
    type: AnnouncementType;
    audience: AnnouncementAudience;
    isEmergency: boolean;
    scheduledAt?: string;
    publishedAt?: string;
    expiresAt?: string;
    isArchived: boolean;
    authorName: string;
    authorType: 'school_user' | 'teacher';
    targetClasses: string[];
    totalTargeted: number;
    readCount: number;
    readRate: number;
    createdAt: string;
    // Feed-specific (mobile)
    isRead: boolean;
    readAt?: string;
}

// ─── Create announcement (teacher — class-level only) ────────────────────────

export interface CreateAnnouncementRequest {
    title: string;
    body: string;
    type: AnnouncementType;
    audience: AnnouncementAudience;
    classIds?: string[];
    scheduledAt?: string;
    expiresAt?: string;
}

// ─── Update announcement ──────────────────────────────────────────────────────

export interface UpdateAnnouncementRequest {
    title?: string;
    body?: string;
    type?: AnnouncementType;
    audience?: AnnouncementAudience;
    classIds?: string[];
    scheduledAt?: string;
    expiresAt?: string;
}

// ─── Mark read ────────────────────────────────────────────────────────────────

export interface MarkReadRequest {
    announcementIds: string[];
}

// ─── Calendar event (lightweight) ────────────────────────────────────────────

export interface CalendarEvent {
    id: string;
    title: string;
    type: AnnouncementType;
    publishedAt?: string;
    expiresAt?: string;
    isEmergency: boolean;
}

// ─── Type display config (colours, icons) ─────────────────────────────────────

export const ANNOUNCEMENT_TYPE_CONFIG: Record<
    AnnouncementType,
    { label: string; colour: string; bgColour: string }
> = {
    GENERAL: { label: 'General', colour: '#6b7280', bgColour: '#f3f4f6' },
    CIRCULAR: { label: 'Circular', colour: '#2563eb', bgColour: '#eff6ff' },
    HOLIDAY: { label: 'Holiday', colour: '#16a34a', bgColour: '#f0fdf4' },
    EVENT: { label: 'Event', colour: '#9333ea', bgColour: '#faf5ff' },
    EXAM_SCHEDULE: { label: 'Exam Schedule', colour: '#d97706', bgColour: '#fffbeb' },
    PARENT_MEETING: { label: 'Parent Meeting', colour: '#0891b2', bgColour: '#ecfeff' },
    EMERGENCY: { label: 'Emergency', colour: '#dc2626', bgColour: '#fef2f2' },
};