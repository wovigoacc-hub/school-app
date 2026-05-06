import { useEffect, useRef, useCallback } from 'react';
import messaging, {
    type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, AppState, type AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/store';
import { selectIsAuthenticated, selectUserId, selectUserType } from '../store/slices/authSlice';
import { showToast } from '../store/slices/uiSlice';
import {
    setCachedPushToken,
} from '../utils/storage.utils';
import type { NotificationData } from '../types/notification.types';
import { NOTIFICATION_SCREEN_MAP } from '../types/notification.types';
import { useRegisterDeviceTokenMutation } from '../services/root/auth.service';

// ─── Navigation ref type (passed in from RootNavigator) ──────────────────────

type NavigationRef = {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    isReady: () => boolean;
};

export function useNotifications(navigationRef?: React.RefObject<NavigationRef>) {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const userId = useAppSelector(selectUserId);
    const userType = useAppSelector(selectUserType);
    const [registerToken] = useRegisterDeviceTokenMutation();
    
    // Use a ref to prevent infinite loops, but we'll be more aggressive now
    const lastRegisteredTokenRef = useRef<string | null>(null);
    const isRegisteringRef = useRef(false);

    // ─── Request permission ──────────────────────────────────────────────────

    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            const authStatus = await messaging().requestPermission();
            return (
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL
            );
        } catch (e) {
            console.error('[Notifications] Permission error:', e);
            return false;
        }
    }, []);

    // ─── Register FCM token with server ──────────────────────────────────────

    const registerFcmToken = useCallback(async (force = false) => {
        // Skip if not logged in or already registering
        if (!isAuthenticated || !userType || isRegisteringRef.current) {
            return;
        }

        try {
            isRegisteringRef.current = true;
            console.log('[Notifications] Starting token registration check...');

            const granted = await requestPermission();
            if (!granted) {
                console.warn('[Notifications] Permission not granted');
                isRegisteringRef.current = false;
                return;
            }

            const token = await messaging().getToken();
            if (!token) {
                console.warn('[Notifications] Could not get FCM token');
                isRegisteringRef.current = false;
                return;
            }

            // FORCE registration if requested, OR if token has changed since last registration in this session
            if (force || token !== lastRegisteredTokenRef.current) {
                console.log(`[Notifications] Syncing token to server for ${userType}...`);
                
                await registerToken({
                    token,
                    platform: Platform.OS as 'ios' | 'android',
                    userType,
                }).unwrap();

                console.log('[Notifications] Token synced successfully');
                lastRegisteredTokenRef.current = token;
                setCachedPushToken(token);
            } else {
                console.log('[Notifications] Token already synced for this session');
            }
        } catch (error) {
            console.error('[Notifications] Sync failed:', error);
        } finally {
            isRegisteringRef.current = false;
        }
    }, [isAuthenticated, userType, registerToken, requestPermission]);

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
            const title = remoteMessage.notification?.title ?? 'New Notification';
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

    // 1. Handle Authentication Changes
    useEffect(() => {
        if (isAuthenticated && userType) {
            console.log('[Notifications] User authenticated, triggering sync');
            registerFcmToken(true); // Force sync on login
        } else {
            lastRegisteredTokenRef.current = null; // Clear on logout
        }
    }, [isAuthenticated, userType, registerFcmToken]);

    // 2. Handle App State (Foreground/Background)
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active' && isAuthenticated) {
                console.log('[Notifications] App resumed, refreshing token');
                registerFcmToken(true); // Force sync on resume
            }
        });
        return () => sub.remove();
    }, [isAuthenticated, registerFcmToken]);

    // 3. Handle Messaging Events
    useEffect(() => {
        const unsubForeground = messaging().onMessage(handleForegroundMessage);

        const unsubBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
            const data = remoteMessage.data as NotificationData | undefined;
            if (data) navigateFromNotification(data);
        });

        messaging().getInitialNotification().then((remoteMessage) => {
            if (remoteMessage) {
                const data = remoteMessage.data as NotificationData | undefined;
                if (data) setTimeout(() => navigateFromNotification(data), 500);
            }
        });

        const unsubRefresh = messaging().onTokenRefresh((newToken) => {
            console.log('[Notifications] Token refreshed by Firebase');
            registerFcmToken(true);
        });

        return () => {
            unsubForeground();
            unsubBackground();
            unsubRefresh();
        };
    }, [handleForegroundMessage, navigateFromNotification, registerFcmToken]);

    return { requestPermission, registerFcmToken };
}
