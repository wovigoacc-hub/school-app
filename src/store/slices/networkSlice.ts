import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/rootReducer';

// ─── State shape ──────────────────────────────────────────────────────────────

export type ConnectionType =
    | 'wifi'
    | 'cellular'
    | 'none'
    | 'unknown';

interface NetworkState {
    isOnline: boolean;
    connectionType: ConnectionType;
    // How many actions are waiting in the offline queue
    pendingQueueCount: number;
    // true while we're flushing the offline queue after coming back online
    isFlushing: boolean;
    // Last time we went offline (Unix ms) — used for UI messages
    wentOfflineAt: number | null;
}

const initialState: NetworkState = {
    isOnline: true,   // optimistic — NetInfo will correct immediately
    connectionType: 'unknown',
    pendingQueueCount: 0,
    isFlushing: false,
    wentOfflineAt: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const networkSlice = createSlice({
    name: 'network',
    initialState,
    reducers: {

        // Called by useNetworkStatus hook when NetInfo fires
        setNetworkStatus: (
            state,
            action: PayloadAction<{
                isOnline: boolean;
                connectionType: ConnectionType;
            }>,
        ) => {
            const wasOffline = !state.isOnline;
            state.isOnline = action.payload.isOnline;
            state.connectionType = action.payload.connectionType;

            if (!action.payload.isOnline && state.wentOfflineAt === null) {
                state.wentOfflineAt = Date.now();
            }

            if (action.payload.isOnline && wasOffline) {
                state.wentOfflineAt = null;
            }
        },

        // Called by offlineMiddleware when an action is queued
        incrementQueueCount: (state) => {
            state.pendingQueueCount += 1;
        },

        // Called by offlineMiddleware when an action is processed from queue
        decrementQueueCount: (state) => {
            state.pendingQueueCount = Math.max(0, state.pendingQueueCount - 1);
        },

        // Called when queue flush starts (coming back online)
        setFlushing: (state, action: PayloadAction<boolean>) => {
            state.isFlushing = action.payload;
        },

        // Sync queue count from MMKV (called on app start)
        syncQueueCount: (state, action: PayloadAction<number>) => {
            state.pendingQueueCount = action.payload;
        },

        // Reset queue count to zero after full flush
        clearQueueCount: (state) => {
            state.pendingQueueCount = 0;
            state.isFlushing = false;
        },
    },
});

export const {
    setNetworkStatus,
    incrementQueueCount,
    decrementQueueCount,
    setFlushing,
    syncQueueCount,
    clearQueueCount,
} = networkSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectIsOnline = (s: RootState) => s.network.isOnline;
export const selectConnectionType = (s: RootState) => s.network.connectionType;
export const selectPendingQueueCount = (s: RootState) => s.network.pendingQueueCount;
export const selectIsFlushing = (s: RootState) => s.network.isFlushing;
export const selectWentOfflineAt = (s: RootState) => s.network.wentOfflineAt;
export const selectIsWifi = (s: RootState) =>
    s.network.connectionType === 'wifi';
export const selectHasPendingQueue = (s: RootState) =>
    s.network.pendingQueueCount > 0;

// Offline duration in seconds (null if currently online)
export const selectOfflineDuration = (s: RootState): number | null => {
    if (s.network.isOnline || !s.network.wentOfflineAt) return null;
    return Math.floor((Date.now() - s.network.wentOfflineAt) / 1000);
};

export default networkSlice.reducer;