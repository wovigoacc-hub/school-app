// ─── Homework status ──────────────────────────────────────────────────────────

export type HomeworkStatus = 'ACTIVE' | 'EXPIRED';

export type SubmissionStatus =
    | 'PENDING'
    | 'SUBMITTED'
    | 'LATE'
    | 'GRADED';

// ─── Homework summary (list) ──────────────────────────────────────────────────

export interface HomeworkSummary {
    id: string;
    classId: string;
    className: string;
    section: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
    schoolId: string;
    title: string;
    instructions?: string;
    dueDate: string;
    isGraded: boolean;
    status: HomeworkStatus;
    isOverdue: boolean;
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    submissionRate: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Homework detail (with submission list) ───────────────────────────────────

export interface HomeworkDetail extends HomeworkSummary {
    submissions: SubmissionStatusRow[];
}

// ─── Submission row (teacher view) ───────────────────────────────────────────

export interface SubmissionStatusRow {
    studentId: string;
    studentName: string;
    rollNumber?: string;
    status: SubmissionStatus;
    submittedAt?: string;
    marksAwarded?: number | null;
    teacherRemarks?: string | null;
}

// ─── Create homework ──────────────────────────────────────────────────────────

export interface CreateHomeworkRequest {
    classId: string;
    subjectId: string;
    title: string;
    instructions?: string;
    dueDate: string;    // "YYYY-MM-DD"
    isGraded?: boolean;
}

// ─── Update homework ──────────────────────────────────────────────────────────

export interface UpdateHomeworkRequest {
    title?: string;
    instructions?: string;
    dueDate?: string;
    isGraded?: boolean;
}

// ─── Mark submission ──────────────────────────────────────────────────────────

export interface MarkSubmissionRequest {
    studentId: string;
    status: 'SUBMITTED' | 'PENDING';
}

export interface BatchMarkSubmissionsRequest {
    studentIds: string[];
    status: 'SUBMITTED' | 'PENDING';
}

// ─── Grade submission ─────────────────────────────────────────────────────────

export interface GradeSubmissionRequest {
    studentId: string;
    marksAwarded?: number | null;
    teacherRemarks?: string;
}

// ─── Parent: homework feed item ───────────────────────────────────────────────

export interface ParentHomeworkItem {
    id: string;
    title: string;
    instructions?: string;
    dueDate: string;
    subjectId: string;
    subjectName: string;
    isGraded: boolean;
    isOverdue: boolean;
    myStatus: SubmissionStatus;
    submittedAt?: string;
    marksAwarded?: number | null;
    teacherRemarks?: string | null;
    createdAt: string;
}