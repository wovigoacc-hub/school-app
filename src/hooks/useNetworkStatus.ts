import { useEffect, useRef, useCallback } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../app/store';
import {
    setNetworkStatus,
    selectIsOnline,
    selectHasPendingQueue,
    type ConnectionType,
} from '../store/slices/networkSlice';
import { getOfflineQueue } from '../utils/storage.utils';
import { flushOfflineQueue } from '../store/middleware/offlineMiddleware';
import { api } from '../services/root/api';

/**
 * Subscribe to network changes and sync status to Redux.
 * When connectivity is restored and there are queued offline actions,
 * automatically flushes the MMKV offline queue.
 *
 * Call this ONCE at the app root level (App.tsx or RootNavigator).
 */
export function useNetworkStatus() {
    const dispatch = useAppDispatch();
    const isOnline = useAppSelector(selectIsOnline);
    const hasPendingQueue = useAppSelector(selectHasPendingQueue);

    // Track previous online state to detect the offline → online transition
    const wasOnlineRef = useRef<boolean>(true);

    // Build the executeEndpoint function RTK Query needs for queue flush
    const executeEndpoint = useCallback(
        async (endpointName: string, args: unknown): Promise<unknown> => {
            // Use RTK Query's initiate to fire the mutation programmatically
            // We cast because endpoint names are dynamic strings
            const endpoint = (api.endpoints as any)[endpointName];
            if (!endpoint?.initiate) {
                throw new Error(`Unknown endpoint: ${endpointName}`);
            }
            const result = await dispatch(endpoint.initiate(args));
            if ('error' in result) throw result.error;
            return result.data;
        },
        [dispatch],
    );

    const handleFlush = useCallback(async () => {
        const queue = await getOfflineQueue();
        if (!queue.length) return;

        // Build a minimal MiddlewareAPI-compatible object for flushOfflineQueue
        const storeApi = {
            getState: () => ({} as any), // not used inside flushOfflineQueue
            dispatch: dispatch as any,
        };

        await flushOfflineQueue(storeApi, executeEndpoint);
    }, [dispatch, executeEndpoint]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const online = state.isConnected === true && state.isInternetReachable !== false;
            const connectionType = (state.type as ConnectionType) ?? 'unknown';

            dispatch(setNetworkStatus({ isOnline: online, connectionType }));

            // Detect offline → online transition
            const wasOffline = !wasOnlineRef.current;
            wasOnlineRef.current = online;

            if (online && wasOffline) {
                // Back online — flush any queued actions
                handleFlush();
            }
        });

        // Fetch initial state immediately
        NetInfo.fetch().then((state: NetInfoState) => {
            const online = state.isConnected === true && state.isInternetReachable !== false;
            const connectionType = (state.type as ConnectionType) ?? 'unknown';
            wasOnlineRef.current = online;
            dispatch(setNetworkStatus({ isOnline: online, connectionType }));
        });

        return unsubscribe;
    }, [dispatch, handleFlush]);

    return { isOnline, hasPendingQueue };
}