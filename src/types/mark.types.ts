import { PaginationParams } from './api.types';

// ─── Mark entry status ────────────────────────────────────────────────────────

export type MarkEntryStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'NOT_ENTERED';

// ─── Single mark record ───────────────────────────────────────────────────────

export interface MarkRecord {
    id: string;
    examId: string;
    examName: string;
    subjectId: string;
    subjectName: string;
    studentId: string;
    studentName: string;
    rollNumber?: string;
    marksObtained: number | null;
    maxMarks: number;
    isAbsent: boolean;
    grade: string | null;
    classRank: number | null;
    teacherRemarks?: string | null;
    status: MarkEntryStatus;
    percentage: number | null;
    isPassed: boolean | null;
    effectivePassMark: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Mark sheet (teacher's entry form data) ───────────────────────────────────

export interface MarkSheet {
    examId: string;
    examName: string;
    subjectId: string;
    subjectName: string;
    classId: string;
    className: string;
    section: string;
    maxMarks: number;
    submissionStatus: MarkEntryStatus | 'NOT_STARTED';
    totalStudents: number;
    enteredCount: number;
    marks: MarkRecord[];
}

// ─── Submit marks request ─────────────────────────────────────────────────────

export interface SubmitMarksRequest {
    examId: string;
    subjectId: string;
    classId: string;
    action: 'DRAFT' | 'SUBMITTED';
    marks: MarkEntryRow[];
}

export interface MarkEntryRow {
    studentId: string;
    marksObtained?: number | null;
    isAbsent?: boolean;
    teacherRemarks?: string;
}

// ─── Submit response ──────────────────────────────────────────────────────────

export interface SubmitMarksResponse {
    examId: string;
    subjectId: string;
    classId: string;
    maxMarks: number;
    action: 'DRAFT' | 'SUBMITTED';
    totalStudents: number;
    enteredCount: number;
    completionPct: number;
    outlierWarnings: string[];
    marks: MarkRecord[];
}

// ─── Grade display ────────────────────────────────────────────────────────────

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export const GRADE_COLOURS: Record<string, string> = {
    'A+': '#16a34a',
    'A': '#22c55e',
    'B+': '#84cc16',
    'B': '#eab308',
    'C': '#f97316',
    'D': '#ef4444',
    'F': '#dc2626',
};

// ─── Progress trend (parent + teacher view) ───────────────────────────────────

export interface SubjectProgressTrend {
    subjectId: string;
    subjectName: string;
    trend: TrendDataPoint[];
}

export interface TrendDataPoint {
    examId: string;
    examName: string;
    examType: string;
    publishedAt: string;
    marksObtained: number | null;
    maxMarks: number;
    percentage: number | null;
    grade: string | null;
    classRank: number | null;
    classAverage: number | null;
}

// ─── Local mark state (optimistic UI during entry) ───────────────────────────

export interface LocalMarkEntry {
    studentId: string;
    studentName: string;
    rollNumber?: string;
    marksObtained: string;   // string during input, parsed before submit
    isAbsent: boolean;
    teacherRemarks: string;
    hasError: boolean;
    errorMessage?: string;
}