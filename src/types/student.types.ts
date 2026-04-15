// ─── Student summary (list view) ─────────────────────────────────────────────

export interface StudentSummary {
    id: string;
    firstName: string;
    lastName: string;
    rollNumber?: string;
    photoUrl?: string;
    classId: string;
    className: string;
    section: string;
    isActive: boolean;
}

// ─── Student detail (full profile with parents) ───────────────────────────────

export interface Student extends StudentSummary {
    admissionNo?: string;
    dateOfBirth?: string;
    schoolId: string;
    createdAt: string;
    parents: StudentParentLink[];
}

// ─── Parent link on student ───────────────────────────────────────────────────

export interface StudentParentLink {
    parentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    relation?: string;
    isPrimary: boolean;
}

// ─── Academic summary (parent + teacher home) ────────────────────────────────

export interface StudentAcademicSummary {
    student: {
        id: string;
        firstName: string;
        lastName: string;
        photoUrl?: string;
        className: string;
        section: string;
        rollNumber?: string;
    };
    attendance: {
        PRESENT?: number;
        ABSENT?: number;
        LATE?: number;
        LEAVE?: number;
        HALF_DAY?: number;
        totalDays: number;
        attendancePct: number | null;
    };
    recentMarks: Array<{
        examName: string;
        examType: string;
        subjectName: string;
        marksObtained: number | null;
        grade: string | null;
        classRank: number | null;
    }>;
    pendingHomeworkCount: number;
}