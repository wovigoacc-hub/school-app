import os

structure = {
    "src": {
        "app": [
            "App.tsx",
            "store.ts",
            "rootReducer.ts",
        ],
        "navigation": [
            "RootNavigator.tsx",
            "AuthNavigator.tsx",
            "TeacherNavigator.tsx",
            "ParentNavigator.tsx",
            "linking.ts",
            "types.ts",
        ],
        "screens": {
            "auth": [
                "LoginScreen.tsx",
                "ChangePasswordScreen.tsx",
            ],
            "teacher": {
                "home": ["TeacherHomeScreen.tsx"],
                "attendance": [
                    "AttendanceClassPickerScreen.tsx",
                    "AttendanceMarkScreen.tsx",
                    "AttendanceHistoryScreen.tsx",
                ],
                "homework": [
                    "HomeworkListScreen.tsx",
                    "HomeworkDetailScreen.tsx",
                    "HomeworkCreateScreen.tsx",
                    "HomeworkSubmissionsScreen.tsx",
                ],
                "marks": [
                    "ExamListScreen.tsx",
                    "MarkSheetScreen.tsx",
                    "MarkEntryScreen.tsx",
                ],
                "announcements": [
                    "AnnouncementFeedScreen.tsx",
                    "AnnouncementCreateScreen.tsx",
                ],
                "requests": [
                    "RequestListScreen.tsx",
                    "RequestDetailScreen.tsx",
                ],
                "profile": ["TeacherProfileScreen.tsx"],
            },
            "parent": {
                "home": ["ParentHomeScreen.tsx"],
                "attendance": [
                    "AttendanceCalendarScreen.tsx",
                    "AttendanceSummaryScreen.tsx",
                ],
                "homework": [
                    "HomeworkFeedScreen.tsx",
                    "HomeworkDetailScreen.tsx",
                ],
                "results": [
                    "ExamListScreen.tsx",
                    "ExamResultScreen.tsx",
                ],
                "announcements": [
                    "AnnouncementFeedScreen.tsx",
                ],
                "requests": [
                    "RequestListScreen.tsx",
                    "RequestCreateScreen.tsx",
                    "RequestDetailScreen.tsx",
                ],
                "profile": ["ParentProfileScreen.tsx"],
            },
        },
        "components": {
            "common": [
                "AppButton.tsx",
                "AppText.tsx",
                "AppInput.tsx",
                "AppBadge.tsx",
                "AppCard.tsx",
                "AppChip.tsx",
                "AppModal.tsx",
                "AppBottomSheet.tsx",
                "AppAvatar.tsx",
                "AppSkeleton.tsx",
                "AppEmptyState.tsx",
                "AppErrorBoundary.tsx",
                "AppRefreshControl.tsx",
                "AppStatusBar.tsx",
            ],
            "layout": [
                "ScreenWrapper.tsx",
                "SectionHeader.tsx",
                "Divider.tsx",
            ],
            "attendance": [
                "StudentAttendanceRow.tsx",
                "AttendanceStatusBadge.tsx",
                "AttendanceSummaryCard.tsx",
            ],
            "homework": [
                "HomeworkCard.tsx",
                "SubmissionStatusRow.tsx",
                "HomeworkDueBadge.tsx",
            ],
            "marks": [
                "MarkInputRow.tsx",
                "GradeBadge.tsx",
                "ProgressTrendChart.tsx",
            ],
            "announcements": [
                "AnnouncementCard.tsx",
                "EmergencyBanner.tsx",
            ],
            "requests": [
                "RequestCard.tsx",
                "RequestStatusStepper.tsx",
                "MessageBubble.tsx",
            ],
            "notifications": [
                "NotificationItem.tsx",
            ],
            "child": [
                "ChildSwitcher.tsx",
                "ChildSummaryCard.tsx",
            ],
        },
        "hooks": [
            "useAuth.ts",
            "useActiveChild.ts",
            "useSchoolId.ts",
            "useOfflineQueue.ts",
            "useNetworkStatus.ts",
            "useNotifications.ts",
            "useKeyboard.ts",
            "useDebounce.ts",
            "useImagePicker.ts",
            "useFilePicker.ts",
        ],
        "services": {
            "teacher": [
                "attendance.service.ts",
                "homework.service.ts",
                "marks.service.ts",
                "announcements.service.ts",
                "requests.service.ts",
                "classes.service.ts",
                "students.service.ts",
                "exams.service.ts",
            ],
            "parent": [
                "attendance.service.ts",
                "homework.service.ts",
                "results.service.ts",
                "announcements.service.ts",
                "requests.service.ts",
                "notifications.service.ts",
            ],
            "root": [
                "api.ts",
                "auth.service.ts",
            ],
        },
        "store": {
            "slices": [
                "authSlice.ts",
                "activeChildSlice.ts",
                "networkSlice.ts",
                "uiSlice.ts",
            ],
            "middleware": [
                "offlineMiddleware.ts",
            ],
        },
        "types": [
            "auth.types.ts",
            "user.types.ts",
            "school.types.ts",
            "student.types.ts",
            "parent.types.ts",
            "teacher.types.ts",
            "class.types.ts",
            "subject.types.ts",
            "attendance.types.ts",
            "exam.types.ts",
            "mark.types.ts",
            "homework.types.ts",
            "announcement.types.ts",
            "request.types.ts",
            "notification.types.ts",
            "api.types.ts",
        ],
        "utils": [
            "date.utils.ts",
            "format.utils.ts",
            "validation.utils.ts",
            "attendance.utils.ts",
            "storage.utils.ts",
            "jwt.utils.ts",
        ],
        "constants": [
            "api.constants.ts",
            "colors.ts",
            "typography.ts",
            "spacing.ts",
            "config.ts",
        ],
        "i18n": {
            "en": [
                "common.json",
                "attendance.json",
                "homework.json",
                "marks.json",
                "requests.json",
            ],
            "ta": [],
            "ml": [],
            "root": ["index.ts"],
        },
        "assets": {
            "images": [],
            "icons": [],
            "fonts": [],
        },
        "config": [
            "reactotron.config.ts",
        ],
    }
}


def create_structure(base_path, tree):
    for name, content in tree.items():
        current_path = os.path.join(base_path, name)

        if isinstance(content, dict):
            os.makedirs(current_path, exist_ok=True)
            create_structure(current_path, content)

        elif isinstance(content, list):
            os.makedirs(current_path, exist_ok=True)
            for file in content:
                file_path = os.path.join(current_path, file)
                with open(file_path, "w") as f:
                    f.write("// Auto-generated file\n")


if __name__ == "__main__":
    create_structure(".", structure)
    print("✅ Folder structure created successfully!")