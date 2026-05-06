import { Language } from './auth.types';

// ─── Teacher profile ──────────────────────────────────────────────────────────

export interface Teacher {
    id: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photoUrl?: string;
    preferredLang: Language;
    isActive: boolean;
    isFirstLogin: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

// ─── Teacher self-update ──────────────────────────────────────────────────────

export interface UpdateTeacherSelfRequest {
    photoUrl?: string;
    phone?: string;
    preferredLang?: Language;
}

// ─── Teacher assignment (timetable entry) ────────────────────────────────────

export interface TeacherAssignment {
    assignmentId: string;
    classId: string;
    className: string;
    section: string;
    subjectId: string;
    subjectName: string;
    isClassTeacher: boolean;
    studentCount: number;
}

// ─── Teacher class (home screen class list) ───────────────────────────────────

export interface TeacherClass {
    classId: string;
    name: string;
    section: string;
    displayOrder: number;
    academicYearName: string;
    isCurrent: boolean;
    studentCount: number;
    isClassTeacher: boolean;
    mySubjects: Array<{
        subjectId: string;
        subjectName: string;
    }>;
    attendanceMode: 'ONCE_DAILY' | 'PERIOD_WISE';
}

// ─── Pending tasks (home screen alerts) ──────────────────────────────────────

export interface TeacherPendingTasks {
    attendanceNotMarked: Array<{
        classId: string;
        className: string;
        section: string;
        date: string;
    }>;
    overdueHomework: Array<{
        homeworkId: string;
        title: string;
        subjectName: string;
        className: string;
        section: string;
        dueDate: string;
        pendingCount: number;
    }>;
    openMarkEntries: Array<{
        examId: string;
        examName: string;
        daysLeft: number;
        subjectCount: number;
    }>;
}