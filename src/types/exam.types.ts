// ─── Exam type and status ─────────────────────────────────────────────────────

export type ExamType =
    | 'UNIT_TEST'
    | 'MIDTERM'
    | 'FINAL'
    | 'QUARTERLY'
    | 'HALF_YEARLY'
    | 'ANNUAL'
    | 'INTERNAL';

export type ExamStatus =
    | 'DRAFT'
    | 'MARKS_OPEN'
    | 'MARKS_CLOSED'
    | 'PUBLISHED'
    | 'UNPUBLISHED';

// ─── Exam summary (list view) ─────────────────────────────────────────────────

export interface ExamSummary {
    id: string;
    name: string;
    type: ExamType;
    status: ExamStatus;
    academicYearId: string;
    academicYearName: string;
    markEntryStart: string;
    markEntryEnd: string;
    publishedAt?: string;
    classCount: number;
    subjectCount: number;
    createdAt: string;
}

// ─── Teacher: open exam for mark entry ───────────────────────────────────────

export interface TeacherOpenExam {
    examId: string;
    name: string;
    type: ExamType;
    markEntryStart: string;
    markEntryEnd: string;
    daysRemaining: number;
    academicYearName: string;
    myClasses: Array<{
        classId: string;
        className: string;
        section: string;
    }>;
    mySubjects: Array<{
        subjectId: string;
        subjectName: string;
        maxMarks: number;
    }>;
}

// ─── Parent: published result for one exam ───────────────────────────────────

export interface PublishedExamResult {
    examId: string;
    examName: string;
    examType: ExamType;
    publishedAt: string;
    totalMarks: number;
    maxTotalMarks: number;
    percentage: number | null;
    classRank: number | null;
    teacherRemarks?: string;
    results: ExamSubjectResult[];
}

export interface ExamSubjectResult {
    subjectId: string;
    subjectName: string;
    marksObtained: number | null;
    maxMarks: number;
    grade: string | null;
    isAbsent: boolean;
    passMark: number;
    isPassed: boolean | null;
}

// ─── Exam subject config ──────────────────────────────────────────────────────

export interface ExamSubjectConfig {
    id: string;
    subjectId: string;
    subjectName: string;
    subjectCode?: string;
    maxMarks: number;
    classId: string;
    className: string;
    section: string;
}