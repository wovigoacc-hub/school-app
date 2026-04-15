import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;         // ms — defaults to 3000
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export interface ModalConfig {
    id: string;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmStyle?: 'default' | 'destructive';
    onConfirmAction?: string;   // action type string to dispatch on confirm
    payload?: unknown;   // passed to the confirm action
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface UiState {
    // Toast notifications (stacked — max 3 visible)
    toasts: Toast[];

    // Global loading overlay (for full-screen blocking operations)
    isGlobalLoading: boolean;
    globalLoadingMessage?: string;

    // Confirmation modal
    modal: ModalConfig | null;

    // Bottom sheet identifier (which sheet is open)
    activeBottomSheet: string | null;

    // Offline sync banner (shown when coming back online with queued actions)
    showSyncBanner: boolean;
}

const initialState: UiState = {
    toasts: [],
    isGlobalLoading: false,
    globalLoadingMessage: undefined,
    modal: null,
    activeBottomSheet: null,
    showSyncBanner: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {

        // ─── Toasts ──────────────────────────────────────────────────────────────

        showToast: (
            state,
            action: PayloadAction<Omit<Toast, 'id'>>,
        ) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const toast: Toast = { id, duration: 3000, ...action.payload };

            // Max 3 toasts — remove oldest if at limit
            if (state.toasts.length >= 3) {
                state.toasts.shift();
            }
            state.toasts.push(toast);
        },

        dismissToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((t) => t.id !== action.payload);
        },

        clearAllToasts: (state) => {
            state.toasts = [];
        },

        // ─── Global loading overlay ───────────────────────────────────────────────

        showGlobalLoading: (
            state,
            action: PayloadAction<string | undefined>,
        ) => {
            state.isGlobalLoading = true;
            state.globalLoadingMessage = action.payload;
        },

        hideGlobalLoading: (state) => {
            state.isGlobalLoading = false;
            state.globalLoadingMessage = undefined;
        },

        // ─── Confirmation modal ───────────────────────────────────────────────────

        showModal: (state, action: PayloadAction<Omit<ModalConfig, 'id'>>) => {
            const id = `modal-${Date.now()}`;
            state.modal = { id, ...action.payload };
        },

        hideModal: (state) => {
            state.modal = null;
        },

        // ─── Bottom sheet ─────────────────────────────────────────────────────────

        openBottomSheet: (state, action: PayloadAction<string>) => {
            state.activeBottomSheet = action.payload;
        },

        closeBottomSheet: (state) => {
            state.activeBottomSheet = null;
        },

        // ─── Sync banner (offline queue flush) ────────────────────────────────────

        showSyncBanner: (state) => {
            state.showSyncBanner = true;
        },

        hideSyncBanner: (state) => {
            state.showSyncBanner = false;
        },
    },
});

export const {
    showToast,
    dismissToast,
    clearAllToasts,
    showGlobalLoading,
    hideGlobalLoading,
    showModal,
    hideModal,
    openBottomSheet,
    closeBottomSheet,
    showSyncBanner,
    hideSyncBanner,
} = uiSlice.actions;

// ─── Convenience action creators ─────────────────────────────────────────────

export const showSuccessToast = (message: string, duration?: number) =>
    showToast({ type: 'success', message, duration });

export const showErrorToast = (message: string, duration?: number) =>
    showToast({ type: 'error', message, duration: duration ?? 4000 });

export const showWarningToast = (message: string, duration?: number) =>
    showToast({ type: 'warning', message, duration });

export const showInfoToast = (message: string, duration?: number) =>
    showToast({ type: 'info', message, duration });

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectToasts = (s: RootState) => s.ui.toasts;
export const selectIsGlobalLoading = (s: RootState) => s.ui.isGlobalLoading;
export const selectGlobalLoadingMsg = (s: RootState) => s.ui.globalLoadingMessage;
export const selectModal = (s: RootState) => s.ui.modal;
export const selectActiveBottomSheet = (s: RootState) => s.ui.activeBottomSheet;
export const selectShowSyncBanner = (s: RootState) => s.ui.showSyncBanner;

// Helper: is a specific bottom sheet open?
export const selectIsSheetOpen = (sheetId: string) => (s: RootState) =>
    s.ui.activeBottomSheet === sheetId;

export default uiSlice.reducer;