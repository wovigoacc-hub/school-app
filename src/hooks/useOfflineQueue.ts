import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import {
    selectPendingQueueCount,
    selectIsFlushing,
    selectIsOnline,
    syncQueueCount,
} from '../store/slices/networkSlice';
import {
    getOfflineQueue,
    clearOfflineQueue,
    type OfflineAction,
} from '../utils/storage.utils';
import { flushOfflineQueue } from '../store/middleware/offlineMiddleware';
import { api } from '../services/root/api';
import { showToast } from '../store/slices/uiSlice';

export function useOfflineQueue() {
    const dispatch = useAppDispatch();
    const queueCount = useAppSelector(selectPendingQueueCount);
    const isFlushing = useAppSelector(selectIsFlushing);
    const isOnline = useAppSelector(selectIsOnline);

    // Sync MMKV queue count to Redux on mount
    // (in case the app was killed while there were queued actions)
    useEffect(() => {
        const queue = getOfflineQueue();
        dispatch(syncQueueCount(queue.length));
    }, [dispatch]);

    // Read the raw queue items (for a debug/review UI if needed)
    const getQueue = useCallback((): OfflineAction[] => {
        return getOfflineQueue();
    }, []);

    // Manual flush trigger — used when user taps "Sync now" button
    const flush = useCallback(async () => {
        if (!isOnline) {
            dispatch(
                showToast({
                    type: 'warning',
                    message: "You're still offline. Connect to sync.",
                    duration: 3000,
                }),
            );
            return;
        }

        const executeEndpoint = async (
            endpointName: string,
            args: unknown,
        ): Promise<unknown> => {
            const endpoint = (api.endpoints as any)[endpointName];
            if (!endpoint?.initiate) throw new Error(`Unknown endpoint: ${endpointName}`);
            const result = await dispatch(endpoint.initiate(args));
            if ('error' in result) throw result.error;
            return result.data;
        };

        const storeApi = { getState: () => ({} as any), dispatch: dispatch as any };
        await flushOfflineQueue(storeApi, executeEndpoint);
    }, [dispatch, isOnline]);

    // Discard the queue entirely — used in settings or after catastrophic error
    const discardQueue = useCallback(() => {
        clearOfflineQueue();
        dispatch(syncQueueCount(0));
        dispatch(
            showToast({
                type: 'info',
                message: 'Offline actions discarded.',
                duration: 3000,
            }),
        );
    }, [dispatch]);

    return {
        queueCount,
        isFlushing,
        hasQueue: queueCount > 0,
        canFlush: isOnline && queueCount > 0 && !isFlushing,
        getQueue,
        flush,
        discardQueue,
    };
}