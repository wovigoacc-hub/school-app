src/
│
├── app/                          # Root app wiring
│   ├── App.tsx                   # Root component — providers stack
│   ├── store.ts                  # Redux store configuration
│   └── rootReducer.ts            # Combined reducer
│
├── navigation/                   # React Navigation
│   ├── RootNavigator.tsx         # Auth gate — decides which tree to show
│   ├── AuthNavigator.tsx         # Login, ForgotPassword screens
│   ├── TeacherNavigator.tsx      # Teacher bottom tabs + nested stacks
│   ├── ParentNavigator.tsx       # Parent bottom tabs + nested stacks
│   ├── linking.ts                # Deep link config
│   └── types.ts                  # RootStackParamList + all screen param types
│
├── screens/                      # One folder per domain, split by role
│   │
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── ChangePasswordScreen.tsx   # Forced on first login
│   │
│   ├── teacher/
│   │   ├── home/
│   │   │   └── TeacherHomeScreen.tsx  # Pending tasks dashboard
│   │   ├── attendance/
│   │   │   ├── AttendanceClassPickerScreen.tsx
│   │   │   ├── AttendanceMarkScreen.tsx
│   │   │   └── AttendanceHistoryScreen.tsx
│   │   ├── homework/
│   │   │   ├── HomeworkListScreen.tsx
│   │   │   ├── HomeworkDetailScreen.tsx
│   │   │   ├── HomeworkCreateScreen.tsx
│   │   │   └── HomeworkSubmissionsScreen.tsx
│   │   ├── marks/
│   │   │   ├── ExamListScreen.tsx
│   │   │   ├── MarkSheetScreen.tsx
│   │   │   └── MarkEntryScreen.tsx
│   │   ├── announcements/
│   │   │   ├── AnnouncementFeedScreen.tsx
│   │   │   └── AnnouncementCreateScreen.tsx
│   │   ├── requests/
│   │   │   ├── RequestListScreen.tsx
│   │   │   └── RequestDetailScreen.tsx
│   │   └── profile/
│   │       └── TeacherProfileScreen.tsx
│   │
│   └── parent/
│       ├── home/
│       │   └── ParentHomeScreen.tsx   # Child summary cards
│       ├── attendance/
│       │   ├── AttendanceCalendarScreen.tsx
│       │   └── AttendanceSummaryScreen.tsx
│       ├── homework/
│       │   ├── HomeworkFeedScreen.tsx
│       │   └── HomeworkDetailScreen.tsx
│       ├── results/
│       │   ├── ExamListScreen.tsx
│       │   └── ExamResultScreen.tsx
│       ├── announcements/
│       │   └── AnnouncementFeedScreen.tsx
│       ├── requests/
│       │   ├── RequestListScreen.tsx
│       │   ├── RequestCreateScreen.tsx
│       │   └── RequestDetailScreen.tsx
│       └── profile/
│           └── ParentProfileScreen.tsx
│
├── components/                   # Reusable UI — never screen-specific logic
│   ├── common/                   # Truly global atoms
│   │   ├── AppButton.tsx
│   │   ├── AppText.tsx
│   │   ├── AppInput.tsx
│   │   ├── AppBadge.tsx
│   │   ├── AppCard.tsx
│   │   ├── AppChip.tsx
│   │   ├── AppModal.tsx
│   │   ├── AppBottomSheet.tsx
│   │   ├── AppAvatar.tsx
│   │   ├── AppSkeleton.tsx       # Loading skeleton placeholder
│   │   ├── AppEmptyState.tsx
│   │   ├── AppErrorBoundary.tsx
│   │   ├── AppRefreshControl.tsx
│   │   └── AppStatusBar.tsx
│   │
│   ├── layout/
│   │   ├── ScreenWrapper.tsx     # SafeAreaView + KeyboardAvoid + scroll
│   │   ├── SectionHeader.tsx
│   │   └── Divider.tsx
│   │
│   ├── attendance/
│   │   ├── StudentAttendanceRow.tsx   # Row in mark sheet (name + status toggle)
│   │   ├── AttendanceStatusBadge.tsx  # PRESENT/ABSENT/LATE/LEAVE chip
│   │   └── AttendanceSummaryCard.tsx  # Percentage ring + counts
│   │
│   ├── homework/
│   │   ├── HomeworkCard.tsx
│   │   ├── SubmissionStatusRow.tsx
│   │   └── HomeworkDueBadge.tsx
│   │
│   ├── marks/
│   │   ├── MarkInputRow.tsx       # Student name + mark input + absent toggle
│   │   ├── GradeBadge.tsx
│   │   └── ProgressTrendChart.tsx # Line chart using react-native-svg
│   │
│   ├── announcements/
│   │   ├── AnnouncementCard.tsx
│   │   └── EmergencyBanner.tsx    # Red full-width banner for emergency
│   │
│   ├── requests/
│   │   ├── RequestCard.tsx
│   │   ├── RequestStatusStepper.tsx
│   │   └── MessageBubble.tsx      # Chat-style thread message
│   │
│   ├── notifications/
│   │   └── NotificationItem.tsx
│   │
│   └── child/
│       ├── ChildSwitcher.tsx      # Horizontal scroll, tap to switch active child
│       └── ChildSummaryCard.tsx
│
<!-- ├── hooks/                        # Custom hooks — one file per concern
│   ├── useAuth.ts                # Current user, role, logout
│   ├── useActiveChild.ts         # Parent: currently selected child from Redux
│   ├── useSchoolId.ts            # schoolId from JWT — used in every API call
│   ├── useOfflineQueue.ts        # MMKV offline action queue
│   ├── useNetworkStatus.ts       # NetInfo wrapper — online/offline
│   ├── useNotifications.ts       # FCM token registration + foreground handler
│   ├── useKeyboard.ts            # Keyboard height for input forms
│   ├── useDebounce.ts
│   ├── useImagePicker.ts         # Image picker + ImageKit upload flow
│   └── useFilePicker.ts          # Document picker + R2 upload flow -->
│
<!-- ├── services/                     # API layer — RTK Query
│   ├── api.ts                    # RTK Query base API (axios base + token injection)
│   ├── auth.service.ts           # login, refresh, logout endpoints
│   ├── teacher/
│   │   ├── attendance.service.ts
│   │   ├── homework.service.ts
│   │   ├── marks.service.ts
│   │   ├── announcements.service.ts
│   │   ├── requests.service.ts
│   │   ├── classes.service.ts
│   │   ├── students.service.ts
│   │   └── exams.service.ts
│   └── parent/
│       ├── attendance.service.ts
│       ├── homework.service.ts
│       ├── results.service.ts
│       ├── announcements.service.ts
│       ├── requests.service.ts
│       └── notifications.service.ts -->
│
<!-- ├── store/                        # Redux slices (client state only)
│   ├── slices/
│   │   ├── authSlice.ts          # user, role, isFirstLogin flag
│   │   ├── activeChildSlice.ts   # Parent: which child is currently selected
│   │   ├── networkSlice.ts       # isOnline flag
│   │   └── uiSlice.ts            # toasts, loading overlays, modal state
│   └── middleware/
│       └── offlineMiddleware.ts  # Intercepts mutations when offline → MMKV queue -->
│
-------------04/15/2026-------------------
<!-- ├── types/                        # TypeScript — mirrors backend DTOs exactly
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── school.types.ts
│   ├── student.types.ts
│   ├── parent.types.ts
│   ├── teacher.types.ts
│   ├── class.types.ts
│   ├── subject.types.ts
│   ├── attendance.types.ts
│   ├── exam.types.ts
│   ├── mark.types.ts
│   ├── homework.types.ts
│   ├── announcement.types.ts
│   ├── request.types.ts
│   ├── notification.types.ts
│   └── api.types.ts              # ApiResponse<T>, PaginatedResponse<T>, etc.
│ -->
<!-- ├── utils/                        # Pure functions — no side effects
│   ├── date.utils.ts             # format, relative time, Tamil calendar
│   ├── format.utils.ts           # currency (₹), percentage, grade display
│   ├── validation.utils.ts       # form validators
│   ├── attendance.utils.ts       # status colour map, icon map
│   ├── storage.utils.ts          # Keychain read/write wrappers
│   └── jwt.utils.ts              # decode JWT, extract role/schoolId/exp -->

-------------04/15/2026-------------------

│
<!-- ├── constants/
│   ├── api.constants.ts          # BASE_URL, endpoint paths
│   ├── colors.ts                 # Design tokens — maps to NativeWind config
│   ├── typography.ts             # Font sizes, weights
│   ├── spacing.ts                # Consistent spacing scale
│   └── config.ts                 # App-wide config (quiet hours, timeouts etc.) -->
│
├── i18n/                         # Internationalisation
│   ├── index.ts                  # i18next init
│   ├── en/
│   │   ├── common.json
│   │   ├── attendance.json
│   │   ├── homework.json
│   │   ├── marks.json
│   │   └── requests.json
│   ├── ta/                       # Tamil
│   │   └── (same structure)
│   └── ml/                       # Malayalam
│       └── (same structure)
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── config/
    └── reactotron.config.ts      # Reactotron debug setup (dev only)