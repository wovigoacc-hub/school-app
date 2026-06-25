import type { NavigatorScreenParams } from '@react-navigation/native';

export type MarkSheetParams = {
    examId: string;
    examName: string;
    subjectId: string;
    subjectName: string;
    classId: string;
    className: string;
    section: string;
    maxMarks: number;
};

// ─── Auth stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
    Login: undefined;
    ChangePassword: undefined;
};

// ─── Teacher bottom tabs ──────────────────────────────────────────────────────

export type TeacherTabParamList = {
    HomeTab: undefined;
    AttendanceTab: undefined;
    HomeworkTab: undefined;
    MarksTab: undefined;
    ProfileTab: undefined;
};

// ─── Teacher stack (wraps tabs + pushed screens) ──────────────────────────────

export type TeacherNavigatorParamList = {
    // ── Tabs ──────────────────────────────────────────────────────────────────
    TeacherTabs: NavigatorScreenParams<TeacherTabParamList>;

    // ── Home ──────────────────────────────────────────────────────────────────
    TeacherHome: undefined;

    // ── Attendance ────────────────────────────────────────────────────────────
    AttendanceClassPicker: { classId?: string } | undefined;
    AttendanceMark: {
        classId: string;
        date: string;          // "YYYY-MM-DD"
        subjectId?: string;
    };
    AttendanceHistory: {
        classId: string;
        subjectId?: string;
        className: string;
        section: string;
    };

    // ── Homework ──────────────────────────────────────────────────────────────
    HomeworkList: undefined;
    HomeworkDetail: { homeworkId: string };
    HomeworkCreate: { classId?: string; subjectId?: string } | undefined;
    HomeworkEdit: { homeworkId: string };
    HomeworkSubmissions: { homeworkId: string; title: string };

    // ── Marks ─────────────────────────────────────────────────────────────────
    ExamList: undefined;
    MarkSheet: MarkSheetParams;
    MarkEntry: MarkSheetParams;
    Marks: { examId: string };

    // ── Announcements ─────────────────────────────────────────────────────────
    Announcements: undefined;
    AnnouncementDetail: { announcementId: string };
    AnnouncementCreate: undefined;

    // ── Requests ──────────────────────────────────────────────────────────────
    RequestList: undefined;
    RequestDetail: { requestId: string };

    // ── Notifications ─────────────────────────────────────────────────────────
    NotificationInbox: undefined;

    // ── Profile ───────────────────────────────────────────────────────────────
    TeacherProfile: undefined;
    ChangePassword: undefined;
    UpdatePassword: undefined;

    // ── Diary ─────────────────────────────────────────────────────────────────
    SchoolDiary: undefined;
};

// ─── Parent bottom tabs ───────────────────────────────────────────────────────

export type ParentTabParamList = {
    HomeTab: undefined;
    AttendanceTab: { studentId: string };
    HomeworkTab: { studentId?: string } | undefined;
    ResultsTab: { studentId: string };
    ProfileTab: undefined;
    UpdatePassword: undefined;
};

// ─── Parent stack ─────────────────────────────────────────────────────────────

export type ParentNavigatorParamList = {
    // ── Tabs ──────────────────────────────────────────────────────────────────
    ParentTabs: NavigatorScreenParams<ParentTabParamList>;

    // ── Home ──────────────────────────────────────────────────────────────────
    ParentHome: undefined;

    // ── Attendance ────────────────────────────────────────────────────────────
    AttendanceCalendar: { studentId: string };
    AttendanceSummary: { studentId: string };

    // ── Homework ──────────────────────────────────────────────────────────────
    HomeworkFeed: { studentId?: string } | undefined;
    HomeworkDetail: { homeworkId: string; studentId: string };

    // ── Results ───────────────────────────────────────────────────────────────
    ExamList: { studentId: string };
    ExamResult: { examId: string; studentId: string; examName: string };
    ProgressChart: { studentId: string };

    // ── Announcements ─────────────────────────────────────────────────────────
    Announcements: undefined;
    AnnouncementDetail: { announcementId: string };

    // ── Requests ──────────────────────────────────────────────────────────────
    RequestList: undefined;
    RequestCreate: { studentId?: string; requestType?: string } | undefined;
    RequestDetail: { requestId: string };

    // ── Notifications ─────────────────────────────────────────────────────────
    NotificationInbox: undefined;

    // ── Profile ───────────────────────────────────────────────────────────────
    ParentProfile: undefined;
    ChangePassword: undefined;
    UpdatePassword: undefined;

    // ── Diary ─────────────────────────────────────────────────────────────────
    SchoolDiary: undefined;
};

// ─── Root navigator ───────────────────────────────────────────────────────────

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Teacher: NavigatorScreenParams<TeacherNavigatorParamList>;
    Parent: NavigatorScreenParams<ParentNavigatorParamList>;
};

// ─── Convenience re-exports ───────────────────────────────────────────────────
// Import screen-specific params from here rather than the full navigator list

export type AttendanceMarkParams = TeacherNavigatorParamList['AttendanceMark'];
export type AttendanceHistoryParams = TeacherNavigatorParamList['AttendanceHistory'];
export type HomeworkDetailTeacherParams = TeacherNavigatorParamList['HomeworkDetail'];
// export type MarkSheetParams = TeacherNavigatorParamList['MarkSheet'];
export type AnnouncementDetailParams = TeacherNavigatorParamList['AnnouncementDetail'];
export type RequestDetailTeacherParams = TeacherNavigatorParamList['RequestDetail'];
export type HomeworkDetailParentParams = ParentNavigatorParamList['HomeworkDetail'];
export type ExamResultParams = ParentNavigatorParamList['ExamResult'];
export type RequestDetailParentParams = ParentNavigatorParamList['RequestDetail'];