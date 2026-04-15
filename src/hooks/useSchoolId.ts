// Auto-generated file
import { useAppSelector } from '../app/store';
import { selectSchoolId, selectIsAuthenticated } from '../store/slices/authSlice';

/**
 * Returns the schoolId from the current user's JWT.
 * Used in every API call as a guard against cross-tenant requests.
 *
 * Returns null if the user is not authenticated.
 * Use the non-null assertion version (useRequiredSchoolId) in screens
 * that are always behind the auth gate.
 */
export function useSchoolId(): string | null {
    return useAppSelector(selectSchoolId);
}

/**
 * Same as useSchoolId but asserts non-null.
 * Safe to use inside authenticated screen stacks — never in auth screens.
 */
export function useRequiredSchoolId(): string {
    const schoolId = useAppSelector(selectSchoolId);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    if (!isAuthenticated || !schoolId) {
        // This should never happen inside an authenticated navigator
        throw new Error(
            'useRequiredSchoolId called outside authenticated context. ' +
            'Use inside TeacherNavigator or ParentNavigator screens only.',
        );
    }

    return schoolId;
}