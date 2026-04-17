import type { LinkingOptions } from '@react-navigation/native';
import { DEEP_LINK } from '../constants/config';
import type { RootStackParamList } from './types';

const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [...DEEP_LINK.PREFIXES],

    config: {
        screens: {
            Auth: {
                screens: {
                    Login: 'login',
                    ChangePassword: 'change-password',
                },
            },

            Teacher: {
                screens: {
                    TeacherTabs: {
                        screens: {
                            HomeTab: 'teacher/home',
                            AttendanceTab: 'teacher/attendance',
                            HomeworkTab: 'teacher/homework',
                            MarksTab: 'teacher/marks',
                            ProfileTab: 'teacher/profile',
                        },
                    },
                    AttendanceClassPicker: 'teacher/attendance/classes',
                    AttendanceMark: 'teacher/attendance/mark/:classId/:date',
                    AttendanceHistory: 'teacher/attendance/history/:classId',
                    HomeworkList: 'teacher/homework/list',
                    HomeworkDetail: 'teacher/homework/:homeworkId',
                    HomeworkCreate: 'teacher/homework/create',
                    HomeworkEdit: 'teacher/homework/:homeworkId/edit',
                    HomeworkSubmissions: 'teacher/homework/:homeworkId/submissions',
                    ExamList: 'teacher/marks/exams',
                    MarkSheet: 'teacher/marks/sheet/:examId/:subjectId/:classId',
                    Marks: 'teacher/marks/:examId',
                    AnnouncementFeed: 'teacher/announcements',
                    AnnouncementDetail: 'teacher/announcements/:announcementId',
                    AnnouncementCreate: 'teacher/announcements/create',
                    RequestList: 'teacher/requests',
                    RequestDetail: 'teacher/requests/:requestId',
                    NotificationInbox: 'teacher/notifications',
                    TeacherProfile: 'teacher/profile/edit',
                },
            },

            Parent: {
                screens: {
                    ParentTabs: {
                        screens: {
                            HomeTab: 'parent/home',
                            AttendanceTab: 'parent/attendance',
                            HomeworkTab: 'parent/homework',
                            ResultsTab: 'parent/results',
                            ProfileTab: 'parent/profile',
                        },
                    },
                    AttendanceCalendar: 'parent/attendance/:studentId/calendar',
                    AttendanceSummary: 'parent/attendance/:studentId/summary',
                    HomeworkFeed: 'parent/homework',
                    HomeworkDetail: 'parent/homework/:homeworkId',
                    ExamList: 'parent/results/:studentId',
                    ExamResult: 'parent/results/:studentId/:examId',
                    ProgressChart: 'parent/results/:studentId/progress',
                    Announcements: 'parent/announcements',
                    AnnouncementDetail: 'parent/announcements/:announcementId',
                    RequestList: 'parent/requests',
                    RequestCreate: 'parent/requests/create',
                    RequestDetail: 'parent/requests/:requestId',
                    NotificationInbox: 'parent/notifications',
                    ParentProfile: 'parent/profile/edit',
                },
            },
        },
    },
};

export default linking;