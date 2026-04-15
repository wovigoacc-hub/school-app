// ─── Class summary ────────────────────────────────────────────────────────────

export interface ClassSummary {
    id: string;
    name: string;
    section: string;
    displayOrder: number;
    academicYearId: string;
    academicYearName: string;
    schoolId: string;
    studentCount: number;
    subjectCount: number;
    teacherCount: number;
    classTeacher?: ClassTeacher;
    createdAt: string;
}

// ─── Class teacher ────────────────────────────────────────────────────────────

export interface ClassTeacher {
    teacherId: string;
    firstName: string;
    lastName: string;
    email: string;
}

// ─── Parent: child's class info ───────────────────────────────────────────────

export interface ChildClassInfo {
    classId: string;
    name: string;
    section: string;
    academicYearName: string;
    classTeacher: string | null;
    subjects: Array<{
        id: string;
        name: string;
        code?: string;
    }>;
}

// ─── Grade group (sidebar tree) ───────────────────────────────────────────────

export interface GradeGroup {
    name: string;
    sections: ClassSummary[];
}