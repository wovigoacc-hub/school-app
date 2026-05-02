import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import {
    selectIsAuthenticated,
    selectUserType,
    updateProfile,
} from '../store/slices/authSlice';
import { setChildren } from '../store/slices/activeChildSlice';
import { useLazyGetParentProfileQuery, useLazyGetTeacherProfileQuery } from '../services/root/profile.service';

/**
 * Hook to hydrate the full user profile after authentication.
 * Triggers on mount and whenever isAuthenticated becomes true.
 * Ensures Redux auth state has firstName, lastName, photoUrl, etc.
 */
export function useHydrateProfile() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const userType = useAppSelector(selectUserType);

    const [triggerParentProfile] = useLazyGetParentProfileQuery();
    const [triggerTeacherProfile] = useLazyGetTeacherProfileQuery();

    useEffect(() => {
        if (!isAuthenticated || !userType) return;

        const hydrate = async () => {
            try {
                if (userType === 'parent') {
                    const result = await triggerParentProfile().unwrap();
                    if (result.success && result.data) {
                        const { firstName, lastName, photoUrl, email, preferredLang, children } = result.data;
                        dispatch(updateProfile({ firstName, lastName, photoUrl, email, preferredLang }));
                        if (children) {
                            dispatch(setChildren(children));
                        }
                    }
                } else if (userType === 'teacher') {
                    const result = await triggerTeacherProfile().unwrap();
                    if (result.success && result.data) {
                        const { firstName, lastName, photoUrl, email, preferredLang } = result.data;
                        dispatch(updateProfile({ firstName, lastName, photoUrl, email, preferredLang }));
                    }
                }
            } catch (error) {
                console.error('Failed to hydrate profile:', error);
            }
        };

        hydrate();
    }, [isAuthenticated, userType, triggerParentProfile, triggerTeacherProfile, dispatch]);
}
