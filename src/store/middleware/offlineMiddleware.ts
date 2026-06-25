import { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { api } from '../../services/root/api';
import { RootState } from '../../app/rootReducer';
import {
    addToOfflineQueue,
    getOfflineQueue,
    removeFromOfflineQueue,
    type OfflineAction,
} from '../../utils/storage.utils';
import {
    incrementQueueCount,
    setFlushing,
    clearQueueCount,
} from '../slices/networkSlice';
import { showToast } from '../slices/uiSlice';

/**
 * offlineMiddleware
 * 
 * Intercepts RTK Query mutations that fail due to network connectivity issues.
 * Instead of returning an error to the UI, it 'silently' queues the action
 * in MMKV and updates the pending queue count in Redux.
 */
const offlineMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
    // We only care about RTK Query mutation results
    if (api.endpoints && action.type.endsWith('/executeMutation/rejected')) {
        const { meta, payload } = action;
        const state = store.getState();

        // Check if error is a network error (no status means network failure in our axios baseQuery)
        const isNetworkError = !payload?.status || payload?.status === 'FETCH_ERROR';
        const isOnline = state.network.isOnline;

        if (isNetworkError || !isOnline) {
            const endpointName = meta.arg.endpointName;
            const originalArgs = meta.arg.originalArgs;

            // Only queue 'safe' mutations (Attendance, Homework, Requests)
            // Auth or Profile edits should probably not be queued implicitly
            const syncableEndpoints = [
                'submitAttendance',
                'submitMarks',
                'createHomework',
                'editHomework',
                'createRequest',
                'addMessage',
            ];

            if (syncableEndpoints.includes(endpointName)) {
                // Add to MMKV
                addToOfflineQueue({
                    type: endpointName,
                    payload: originalArgs,
                }).catch(console.error);

                // Update Redux count
                store.dispatch(incrementQueueCount());

                // Notify user
                store.dispatch(
                    showToast({
                        type: 'info',
                        message: 'No connection. Action saved to offline queue.',
                        duration: 4000,
                    })
                );

                // Return a fake success or handled state to avoid UI 'Error' screens
                // Many components check isLoading/isError from the hook
                return next({
                    ...action,
                    error: undefined,
                    payload: { data: { success: true, offline: true } },
                });
            }
        }
    }

    return next(action);
};

/**
 * flushOfflineQueue
 * 
 * Process all queued items one by one. Called automatically by useNetworkStatus
 * when coming back online, or manually from the UI.
 */
export async function flushOfflineQueue(
    store: MiddlewareAPI,
    executeEndpoint: (name: string, args: any) => Promise<any>
) {
    const queue = await getOfflineQueue();
    if (!queue.length) return;

    store.dispatch(setFlushing(true));

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
        try {
            await executeEndpoint(item.type, item.payload);
            await removeFromOfflineQueue(item.id);
            successCount++;
        } catch (error) {
            console.error(`[Offline] Failed to sync ${item.id}:`, error);
            failCount++;
            // We keep it in the queue for next attempt if it failed again
        }
    }

    if (successCount > 0 && failCount === 0) {
        store.dispatch(clearQueueCount());
        store.dispatch(
            showToast({
                type: 'success',
                message: `${successCount} items synced successfully.`,
            })
        );
    } else if (successCount > 0) {
        // Partial success
        const remaining = (await getOfflineQueue()).length;
        store.dispatch(showToast({
            type: 'warning',
            message: `${successCount} synced, ${failCount} failed to sync.`,
        }));
    }

    store.dispatch(setFlushing(false));
}

export default offlineMiddleware;