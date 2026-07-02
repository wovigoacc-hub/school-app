import { Platform } from 'react-native';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Dev: Android emulator uses 10.0.2.2 to reach localhost on host machine
// Dev: iOS simulator uses localhost directly
// Production: read from env / build config
// www.schoolserver.wovigo.com
const DEV_BASE_URL = Platform.select({
    android: 'https://www.schoolserver.wovigo.com',
    ios: 'https://www.schoolserver.wovigo.com',
    default: 'https://www.schoolserver.wovigo.com',
});

export const API_BASE_URL =
    __DEV__
        ? DEV_BASE_URL
        : 'https://www.schoolserver.wovigo.com';   // swap to your production URL

// ─── School identifier ────────────────────────────────────────────────────────
// This app is built for a specific school — set to the school's slug in the database.
// In production, inject this via build config / environment flavors.
export const SCHOOL_SLUG = 'school'; // ← change to match your school's slug

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const AUTH_ENDPOINTS = {
    TEACHER_LOGIN: '/auth/mobile/teacher/login',
    PARENT_LOGIN: '/auth/mobile/parent/login',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    DEVICE_TOKEN: '/auth/device-token',
} as const;

// ─── Teacher mobile endpoints ─────────────────────────────────────────────────

export const TEACHER_ENDPOINTS = {
    // Profile
    PROFILE: '/mobile/teacher/profile',

    // Classes & students
    MY_CLASSES: '/mobile/teacher/classes',
    MY_SUBJECTS: '/mobile/teacher/subjects',
    CLASS_STUDENTS: (classId: string) =>
        `/mobile/teacher/students/class/${classId}`,
    STUDENT_SUMMARY: (studentId: string) =>
        `/mobile/teacher/students/${studentId}/academic-summary`,

    // Attendance
    ATTENDANCE_SESSION: '/mobile/teacher/attendance/session',
    ATTENDANCE_SUBMIT: '/mobile/teacher/attendance',
    ATTENDANCE_CORRECT: '/mobile/teacher/attendance/correction',

    // Homework
    HOMEWORK_LIST: '/mobile/teacher/homework',
    HOMEWORK_DETAIL: (id: string) => `/mobile/teacher/homework/${id}`,
    HOMEWORK_SUBMIT: (id: string) => `/mobile/teacher/homework/${id}/submission`,
    HOMEWORK_BATCH: (id: string) => `/mobile/teacher/homework/${id}/submissions/batch`,
    HOMEWORK_GRADE: (id: string) => `/mobile/teacher/homework/${id}/grade`,

    // Marks
    MARK_SHEET: '/mobile/teacher/marks/sheet',
    MARK_SUBMIT: '/mobile/teacher/marks',
    MARK_PROGRESS: (studentId: string) =>
        `/mobile/teacher/marks/student/${studentId}/progress`,

    // Exams
    OPEN_EXAMS: '/mobile/teacher/exams',

    // Announcements
    ANNOUNCEMENTS: '/mobile/teacher/announcements',
    ANNOUNCEMENT_ITEM: (id: string) => `/mobile/teacher/announcements/${id}`,
    ANNOUNCEMENTS_READ: '/mobile/teacher/announcements/mark-read',
    ANNOUNCEMENTS_UNREAD_COUNT: '/mobile/teacher/announcements/unread-count',

    // Requests
    REQUESTS: '/mobile/teacher/requests',
    REQUEST_DETAIL: (id: string) => `/mobile/teacher/requests/${id}`,
    REQUEST_MESSAGES: (id: string) => `/mobile/teacher/requests/${id}/messages`,
    REQUEST_STATUS: (id: string) => `/mobile/teacher/requests/${id}/status`,

    // Notifications
    NOTIFICATIONS: '/mobile/teacher/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/mobile/teacher/notifications/unread-count',
    NOTIFICATIONS_MARK: '/mobile/teacher/notifications/mark-delivered',
    NOTIFICATIONS_MARK_ALL: '/mobile/teacher/notifications/mark-all-delivered',
} as const;

// ─── Parent mobile endpoints ──────────────────────────────────────────────────

export const PARENT_ENDPOINTS = {
    // Profile + children
    PROFILE: '/mobile/parent/profile',

    // Attendance
    CHILD_TODAY: (studentId: string) =>
        `/mobile/parent/attendance/${studentId}/today`,
    CHILD_ATTENDANCE: (studentId: string) =>
        `/mobile/parent/attendance/${studentId}`,

    // Homework
    CHILD_HOMEWORK: (studentId: string) =>
        `/mobile/parent/students/${studentId}/homework`,
    HOMEWORK_SUBMIT: (studentId: string, homeworkId: string) =>
        `/mobile/parent/students/${studentId}/homework/${homeworkId}/submit`,

    // Results
    CHILD_RESULTS: (studentId: string) =>
        `/mobile/parent/students/${studentId}/results`,
    CHILD_PROGRESS: (studentId: string) =>
        `/mobile/parent/students/${studentId}/progress`,

    // Announcements
    ANNOUNCEMENTS: '/mobile/parent/announcements',
    ANNOUNCEMENT_ITEM: (id: string) => `/mobile/parent/announcements/${id}`,
    ANNOUNCEMENTS_READ: '/mobile/parent/announcements/mark-read',
    ANNOUNCEMENTS_UNREAD_COUNT: '/mobile/parent/announcements/unread-count',
    CALENDAR_EVENTS: '/mobile/parent/announcements/calendar/events',

    // Requests
    REQUESTS: '/mobile/parent/requests',
    REQUEST_DETAIL: (id: string) => `/mobile/parent/requests/${id}`,
    REQUEST_MESSAGES: (id: string) => `/mobile/parent/requests/${id}/messages`,
    REQUEST_CLOSE: (id: string) => `/mobile/parent/requests/${id}/close`,

    // Notifications
    NOTIFICATIONS: '/mobile/parent/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/mobile/parent/notifications/unread-count',
    NOTIFICATIONS_MARK: '/mobile/parent/notifications/mark-delivered',
    NOTIFICATIONS_MARK_ALL: '/mobile/parent/notifications/mark-all-delivered',
} as const;

// ─── ImageKit endpoints ───────────────────────────────────────────────────────

export const IMAGEKIT_ENDPOINTS = {
    MOBILE_AUTH: '/mobile/imagekit/auth',
    MOBILE_CONFIRM: '/mobile/imagekit/confirm',
    MOBILE_DELETE: '/mobile/imagekit',
    ADMIN_AUTH: '/school/imagekit/auth',
    ADMIN_CONFIRM: '/school/imagekit/confirm',
} as const;

// ─── Files (R2) endpoints ─────────────────────────────────────────────────────

export const FILES_ENDPOINTS = {
    UPLOAD_URL: '/mobile/teacher/files/upload-url',
    CONFIRM: '/mobile/teacher/files/confirm',
    DOWNLOAD_URL: (id: string) => `/mobile/teacher/files/${id}/download-url`,
    PARENT_DOWNLOAD: (id: string) => `/mobile/parent/files/${id}/download-url`,
} as const;