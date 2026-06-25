import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import {
    selectActiveChild,
    selectActiveChildId,
    selectActiveChildName,
    selectActiveChildClassLabel,
    selectChildren,
    selectChildrenLoaded,
    selectHasMultipleChildren,
    selectChildCount,
    switchActiveChild,
    initChildren,
} from '../store/slices/activeChildSlice';
import { selectIsParent } from '../store/slices/authSlice';
import type { LinkedChild } from '../types/parent.types';

export function useActiveChild() {
    const dispatch = useAppDispatch();
    const isParent = useAppSelector(selectIsParent);

    const activeChild = useAppSelector(selectActiveChild);
    const activeChildId = useAppSelector(selectActiveChildId);
    const activeChildName = useAppSelector(selectActiveChildName);
    const classLabel = useAppSelector(selectActiveChildClassLabel);
    const children = useAppSelector(selectChildren);
    const isLoaded = useAppSelector(selectChildrenLoaded);
    const hasMultiple = useAppSelector(selectHasMultipleChildren);
    const childCount = useAppSelector(selectChildCount);

    // Switch the active child — validates in Redux before persisting to MMKV
    const switchChild = useCallback(
        (studentId: string) => {
            dispatch(switchActiveChild(studentId));
        },
        [dispatch],
    );

    // Called once after parent profile API loads
    const loadChildren = useCallback(
        (linkedChildren: LinkedChild[]) => {
            dispatch(initChildren(linkedChildren));
        },
        [dispatch],
    );

    return {
        // null for teacher users — always guard with isParent before using
        activeChild,
        activeChildId,
        activeChildName,
        classLabel,
        children,
        isLoaded,
        hasMultiple,
        childCount,
        isParent,

        // Actions
        switchChild,
        loadChildren,
    };
}