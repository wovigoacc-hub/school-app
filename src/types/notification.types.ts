// ─── Notification channel and status ─────────────────────────────────────────

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS';

export type NotificationStatus =
    | 'PENDING'
    | 'SENT'
    | 'DELIVERED'
    | 'FAILED';

// ─── Notification record (inbox item) ────────────────────────────────────────

export interface NotificationRecord {
    id: string;
    title: string;
    body: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    data?: NotificationData;
    failureReason?: string;
    sentAt?: string;
    deliveredAt?: string;
    createdAt: string;
}

// ─── Deep link data (navigates app on tap) ───────────────────────────────────

export interface NotificationData {
    screen?: string;     // e.g. "AttendanceHistory", "HomeworkFeed"
    homeworkId?: string;
    examId?: string;
    requestId?: string;
    announcementId?: string;
    studentName?: string;
}

// ─── Unread count (badge) ─────────────────────────────────────────────────────

export interface UnreadCountResponse {
    unreadCount: number;
}

// ─── Mark delivered request ───────────────────────────────────────────────────

export interface MarkDeliveredRequest {
    notificationIds: string[];
}

// ─── FCM foreground message (received while app is open) ─────────────────────

export interface ForegroundNotification {
    messageId: string;
    title: string;
    body: string;
    data?: NotificationData;
    sentTime?: number;
}

// ─── Screen → notification category map (for deep linking) ───────────────────

export const NOTIFICATION_SCREEN_MAP: Record<string, string> = {
    AttendanceHistory: 'ParentAttendance',
    HomeworkFeed: 'ParentHomework',
    Results: 'ParentResults',
    Announcements: 'Announcements',
    RequestDetail: 'RequestDetail',
    MarkEntry: 'TeacherMarks',
    Requests: 'TeacherRequests',
};