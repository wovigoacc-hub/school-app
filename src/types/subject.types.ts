// ─── Subject ──────────────────────────────────────────────────────────────────

export interface Subject {
    id: string;
    classId: string;
    className: string;
    section: string;
    schoolId: string;
    name: string;
    code?: string;
    passMark?: number | null;
    displayOrder: number;
    effectivePassMark: number;    // subject passMark ?? school globalPassMarkPct
    assignedTeachers: AssignedTeacher[];
    createdAt: string;
    updatedAt: string;
}

// ─── Assigned teacher on subject ─────────────────────────────────────────────

export interface AssignedTeacher {
    assignmentId: string;
    teacherId: string;
    firstName: string;
    lastName: string;
    email: string;
}

// ─── Teacher's subject (from mobile assignment view) ─────────────────────────

export interface TeacherSubject {
    assignmentId: string;
    subjectId: string;
    name: string;
    code?: string;
    effectivePassMark: number;
    displayOrder: number;
    classId: string;
    className: string;
    section: string;
    isClassTeacher: boolean;
}

// ─── Parent: child's subject ──────────────────────────────────────────────────

export interface ChildSubject {
    id: string;
    name: string;
    code?: string;
    effectivePassMark: number;
    displayOrder: number;
}