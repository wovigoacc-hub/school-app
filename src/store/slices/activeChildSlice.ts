import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { LinkedChild } from '../../types/parent.types';
import {
    setActiveChildId,
    getActiveChildId,
    clearActiveChildId,
} from '../../utils/storage.utils';
import { clearAuth } from './authSlice';

// ─── State shape ──────────────────────────────────────────────────────────────

interface ActiveChildState {
    // The full list of children linked to this parent
    children: LinkedChild[];

    // The currently selected child's studentId
    activeChildId: string | null;

    // Whether children list has been loaded from the API
    isLoaded: boolean;
}

const initialState: ActiveChildState = {
    children: [],
    activeChildId: null,
    isLoaded: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const activeChildSlice = createSlice({
    name: 'activeChild',
    initialState,
    reducers: {

        // Called after parent profile loads — sets the full children list
        // and restores the last-selected child from MMKV (or defaults to primary)
        setChildren: (state, action: PayloadAction<LinkedChild[]>) => {
            state.children = action.payload;
            state.isLoaded = true;

            if (!action.payload.length) {
                state.activeChildId = null;
                return;
            }

            // Restore last selection from MMKV
            const stored = getActiveChildId();
            const stillLinked =
                stored && action.payload.some((c) => c.studentId === stored);

            if (stillLinked) {
                state.activeChildId = stored;
            } else {
                // Default: primary child first, otherwise first in list
                const primary = action.payload.find((c) => c.isPrimary);
                state.activeChildId =
                    primary?.studentId ?? action.payload[0].studentId;
                setActiveChildId(state.activeChildId);
            }
        },

        // Called when parent taps the child switcher
        switchActiveChild: (state, action: PayloadAction<string>) => {
            const studentId = action.payload;
            const exists = state.children.some((c) => c.studentId === studentId);

            if (!exists) return; // Guard: can't switch to a child not in list

            state.activeChildId = studentId;
            setActiveChildId(studentId); // persist to MMKV
        },

        // Called when a new child is added to the parent's account
        addChild: (state, action: PayloadAction<LinkedChild>) => {
            const exists = state.children.some(
                (c) => c.studentId === action.payload.studentId,
            );
            if (!exists) {
                state.children.push(action.payload);
            }

            // Auto-select if this is the first child
            if (!state.activeChildId) {
                state.activeChildId = action.payload.studentId;
                setActiveChildId(action.payload.studentId);
            }
        },

        // Reset on logout
        clearActiveChild: (state) => {
            state.children = [];
            state.activeChildId = null;
            state.isLoaded = false;
            clearActiveChildId();
        },
    },
    extraReducers: (builder) => {
        // Clear child state when auth is cleared (logout / session expired)
        builder.addCase(clearAuth, (state) => {
            state.children = [];
            state.activeChildId = null;
            state.isLoaded = false;
        });
    },
});

export const {
    setChildren,
    switchActiveChild,
    addChild,
    clearActiveChild,
} = activeChildSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectChildren = (s: RootState) => s.activeChild.children;
export const selectActiveChildId = (s: RootState) => s.activeChild.activeChildId;
export const selectChildrenLoaded = (s: RootState) => s.activeChild.isLoaded;
export const selectChildCount = (s: RootState) => s.activeChild.children.length;
export const selectHasMultipleChildren = (s: RootState) =>
    s.activeChild.children.length > 1;

// Returns the full LinkedChild object for the currently selected child
export const selectActiveChild = (s: RootState): LinkedChild | null => {
    if (!s.activeChild.activeChildId) return null;
    return (
        s.activeChild.children.find(
            (c) => c.studentId === s.activeChild.activeChildId,
        ) ?? null
    );
};

// Returns the active child's class display string e.g. "Grade 7 A"
export const selectActiveChildClassLabel = (s: RootState): string => {
    const child = selectActiveChild(s);
    if (!child) return '';
    return `${child.className} ${child.section}`;
};

// Returns the active child's full name
export const selectActiveChildName = (s: RootState): string => {
    const child = selectActiveChild(s);
    if (!child) return '';
    return `${child.firstName} ${child.lastName}`;
};

export default activeChildSlice.reducer;