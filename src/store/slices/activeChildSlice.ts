import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { LinkedChild } from '../../types/parent.types';
import {
    setActiveChildId,
    getActiveChildId,
    clearActiveChildId,
} from '../../utils/storage.utils';
import { clearAuth } from './authSlice';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const initChildren = createAsyncThunk(
    'activeChild/initChildren',
    async (children: LinkedChild[]) => {
        if (!children.length) return { children, activeChildId: null };

        // Restore last selection from AsyncStorage
        const stored = await getActiveChildId();
        const stillLinked = stored && children.some((c) => c.studentId === stored);

        let activeChildId = stored;
        if (!stillLinked) {
            // Default: primary child first, otherwise first in list
            const primary = children.find((c) => c.isPrimary);
            activeChildId = primary?.studentId ?? children[0].studentId;
            setActiveChildId(activeChildId).catch(console.error); // Fire and forget async write
        }

        return { children, activeChildId };
    }
);

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
        // Called when parent taps the child switcher
        switchActiveChild: (state, action: PayloadAction<string>) => {
            const studentId = action.payload;
            const exists = state.children.some((c) => c.studentId === studentId);

            if (!exists) return; // Guard: can't switch to a child not in list

            state.activeChildId = studentId;
            setActiveChildId(studentId).catch(console.error); // persist to AsyncStorage
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
                setActiveChildId(action.payload.studentId).catch(console.error);
            }
        },

        // Reset on logout
        clearActiveChild: (state) => {
            state.children = [];
            state.activeChildId = null;
            state.isLoaded = false;
            clearActiveChildId().catch(console.error);
        },
    },
    extraReducers: (builder) => {
        // Clear child state when auth is cleared (logout / session expired)
        builder.addCase(clearAuth, (state) => {
            state.children = [];
            state.activeChildId = null;
            state.isLoaded = false;
        });

        // Handle async initChildren
        builder.addCase(initChildren.fulfilled, (state, action) => {
            state.children = action.payload.children;
            state.activeChildId = action.payload.activeChildId;
            state.isLoaded = true;
        });
    },
});

export const {
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