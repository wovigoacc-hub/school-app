import React, { useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../app/store';
import { bootstrapAuth } from '../store/slices/authSlice';
import {
    selectIsAuthenticated,
    selectIsBootstrapping,
    selectIsFirstLogin,
    selectIsTeacher,
    selectIsParent,
} from '../store/slices/authSlice';
import { setChildren } from '../store/slices/activeChildSlice';
import { AuthNavigator } from './AuthNavigator';
import { TeacherNavigator } from './TeacherNavigator';
import { ParentNavigator } from './ParentNavigator';
import { AppModal } from '../components/common/AppModal';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useNotifications } from '../hooks/useNotifications';
import { useHydrateProfile } from '../hooks/useHydrateProfile';
import linking from './linking';
import { Colors } from '../constants/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Splash / bootstrap screen ────────────────────────────────────────────────

function BootstrapScreen() {
    return (
        <View style={styles.splash}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );
}

// ─── Inner navigator (reads auth state) ──────────────────────────────────────

function AppNavigator() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBootstrapping = useAppSelector(selectIsBootstrapping);
    const isFirstLogin = useAppSelector(selectIsFirstLogin);
    const isTeacher = useAppSelector(selectIsTeacher);
    const isParent = useAppSelector(selectIsParent);

    // Bootstrap on mount — reads Keychain tokens and hydrates Redux
    useEffect(() => {
        dispatch(bootstrapAuth());
    }, [dispatch]);

    // Network status subscription — sets isOnline, flushes offline queue on reconnect
    useNetworkStatus();

    // Hydrate profile if authenticated (name, photo, children)
    useHydrateProfile();

    // Show splash while checking stored tokens
    if (isBootstrapping) return <BootstrapScreen />;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            {!isAuthenticated ? (
                // ── Unauthenticated ────────────────────────────────────────────────
                <Stack.Screen key="auth" name="Auth" component={AuthNavigator} />
            ) : isFirstLogin ? (
                // ── First login — must change password ────────────────────────────
                // key="auth-firstlogin" forces remount so initialParams take effect.
                // LoginScreen also explicitly calls navigation.navigate('ChangePassword')
                // as a belt-and-suspenders approach.
                <Stack.Screen
                    key="auth-firstlogin"
                    name="Auth"
                    component={AuthNavigator}
                    initialParams={{ screen: 'ChangePassword' } as any}
                />
            ) : isTeacher ? (
                // ── Teacher app ───────────────────────────────────────────────────
                <Stack.Screen key="teacher" name="Teacher" component={TeacherNavigator} />
            ) : isParent ? (
                // ── Parent app ────────────────────────────────────────────────────
                <Stack.Screen key="parent" name="Parent" component={ParentNavigator} />
            ) : (
                // ── Fallback (shouldn't happen) ───────────────────────────────────
                <Stack.Screen key="auth-fallback" name="Auth" component={AuthNavigator} />
            )}
        </Stack.Navigator>
    );
}

// ─── Root navigator (wraps NavigationContainer) ───────────────────────────────

export function RootNavigator() {
    const navigationRef = useRef<any>(null);

    // Notifications hook — pass nav ref for deep-link navigation on tap
    useNotifications(navigationRef);

    return (
        <NavigationContainer
            ref={navigationRef}
            linking={linking}
            // Fallback shown while deep link resolves
            fallback={<BootstrapScreen />}
        >
            <AppNavigator />
            {/* Global modal — responds to dispatch(showModal(...)) from anywhere */}
            <AppModal />
        </NavigationContainer>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});