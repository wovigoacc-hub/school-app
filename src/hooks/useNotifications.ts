import { useEffect, useRef, useCallback } from 'react';
import messaging, {
    type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, AppState, type AppStateStatus } from 'react-native';
import { useAppDispatch } from '../app/store';
import { showToast } from '../store/slices/uiSlice';
import {
    setCachedPushToken,
    getCachedPushToken,
} from '../utils/storage.utils';
import type { NotificationData } from '../types/notification.types';
import { NOTIFICATION_SCREEN_MAP } from '../types/notification.types';
import { useRegisterDeviceTokenMutation } from '../services/root/auth.service';

// ─── Navigation ref type (passed in from RootNavigator) ──────────────────────
// We accept a ref rather than importing navigation directly to avoid
// the hook depending on navigation context (can be called before nav mounts)

type NavigationRef = {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    isReady: () => boolean;
};

export function useNotifications(navigationRef?: React.RefObject<NavigationRef>) {
    const dispatch = useAppDispatch();
    const { isAuthenticated, userId } = useAuth();
    const [registerToken] = useRegisterDeviceTokenMutation();
    const tokenRegisteredRef = useRef(false);

    // ─── Request permission ──────────────────────────────────────────────────

    const requestPermission = useCallback(async (): Promise<boolean> => {
        const authStatus = await messaging().requestPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    }, []);

    // ─── Register FCM token with server ──────────────────────────────────────

    const registerFcmToken = useCallback(async () => {
        if (!isAuthenticated || tokenRegisteredRef.current) return;

        try {
            const granted = await requestPermission();
            if (!granted) return;

            const token = await messaging().getToken();
            if (!token) return;

            const cached = getCachedPushToken();

            // Only register if token is new or changed
            if (token !== cached) {
                await registerToken({
                    token,
                    platform: Platform.OS as 'ios' | 'android',
                }).unwrap();
                setCachedPushToken(token);
            }

            tokenRegisteredRef.current = true;
        } catch {
            // Non-fatal — push notifications degrade gracefully
        }
    }, [isAuthenticated, registerToken, requestPermission]);

    // ─── Handle navigation from notification data ────────────────────────────

    const navigateFromNotification = useCallback(
        (data: NotificationData) => {
            if (!navigationRef?.current?.isReady()) return;
            if (!data.screen) return;

            const screenName = NOTIFICATION_SCREEN_MAP[data.screen] ?? data.screen;

            const params: Record<string, unknown> = {};
            if (data.homeworkId) params.homeworkId = data.homeworkId;
            if (data.examId) params.examId = data.examId;
            if (data.requestId) params.requestId = data.requestId;
            if (data.announcementId) params.announcementId = data.announcementId;

            navigationRef.current.navigate(screenName, params);
        },
        [navigationRef],
    );

    // ─── Show in-app toast for foreground messages ───────────────────────────

    const handleForegroundMessage = useCallback(
        (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
            const title = remoteMessage.notification?.title ?? '';
            const body = remoteMessage.notification?.body ?? '';

            dispatch(
                showToast({
                    type: 'info',
                    message: body ? `${title}: ${body}` : title,
                    duration: 4000,
                }),
            );
        },
        [dispatch],
    );

    // ─── Effects ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isAuthenticated) return;

        // Register token when authenticated
        registerFcmToken();

        // Refresh token when app comes to foreground (token may have rotated)
        const appStateSub = AppState.addEventListener(
            'change',
            (state: AppStateStatus) => {
                if (state === 'active') {
                    tokenRegisteredRef.current = false; // allow re-check
                    registerFcmToken();
                }
            },
        );

        return () => {
            appStateSub.remove();
        };
    }, [isAuthenticated, registerFcmToken]);

    useEffect(() => {
        // Foreground message handler
        const unsubForeground = messaging().onMessage(handleForegroundMessage);

        // Background / quit tap handler — app opened from notification
        const unsubBackground = messaging().onNotificationOpenedApp(
            (remoteMessage) => {
                const data = remoteMessage.data as NotificationData | undefined;
                if (data) navigateFromNotification(data);
            },
        );

        // Check if app was launched from a quit-state notification
        messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
                if (remoteMessage) {
                    const data = remoteMessage.data as NotificationData | undefined;
                    if (data) {
                        // Small delay — navigator needs to be ready
                        setTimeout(() => navigateFromNotification(data), 500);
                    }
                }
            });

        // Token refresh handler (FCM may rotate the token)
        const unsubRefresh = messaging().onTokenRefresh((newToken) => {
            setCachedPushToken(newToken);
            tokenRegisteredRef.current = false;
            registerFcmToken();
        });

        return () => {
            unsubForeground();
            unsubBackground();
            unsubRefresh();
        };
    }, [handleForegroundMessage, navigateFromNotification, registerFcmToken]);

    return { requestPermission, registerFcmToken };
}

function useAuth(): { isAuthenticated: any; userId: any; } {
    throw new Error('Function not implemented.');
}
