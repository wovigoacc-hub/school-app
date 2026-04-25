import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/common/AppText';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { AppStatusBar } from '../../components/common/AppStatusBar';
import { Divider } from '../../components/layout/Divider';
import { useAppDispatch } from '../../app/store';
import { setAuth } from '../../store/slices/authSlice';
import {
    useTeacherLoginMutation,
    useParentLoginMutation,
} from '../../services/root/auth.service';
import { storeTokens } from '../../utils/storage.utils';
import {
    required,
    validEmail,
    minPasswordLength,
    composeValidators,
} from '../../utils/validation.utils';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { SCHOOL_SLUG } from '../../constants/api.constants';
import type { UserType } from '../../types/auth.types';
import type { AuthStackParamList } from '../../navigation/types';

type AuthNav = NativeStackNavigationProp<AuthStackParamList>;

// ─── Form shape ───────────────────────────────────────────────────────────────

interface LoginFormValues {
    email: string;
    password: string;
}

// ─── Error message helpers ────────────────────────────────────────────────────

function parseLoginError(error: any): string {
    const status = error?.status ?? error?.data?.statusCode;
    const message = error?.data?.message ?? error?.message;

    if (status === 401) return 'Incorrect email or password. Please try again.';
    if (status === 403) return 'Your account has been deactivated. Contact your school administrator.';
    if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (typeof message === 'string') return message;
    return 'Login failed. Please check your connection and try again.';
}

// ─── Role toggle ──────────────────────────────────────────────────────────────

interface RoleToggleProps {
    selected: UserType;
    onChange: (role: UserType) => void;
}

function RoleToggle({ selected, onChange }: RoleToggleProps) {
    return (
        <View style={styles.roleToggle}>
            {(['teacher', 'parent'] as UserType[]).map((role) => {
                const isActive = selected === role;
                return (
                    <TouchableOpacity
                        key={role}
                        onPress={() => onChange(role)}
                        style={[
                            styles.roleBtn,
                            isActive && styles.roleBtnActive,
                        ]}
                        accessibilityRole="radio"
                        accessibilityLabel={role === 'teacher' ? 'I am a teacher' : 'I am a parent'}
                        accessibilityState={{ checked: isActive }}
                    >
                        <AppText
                            style={[
                                styles.roleBtnText,
                                isActive && styles.roleBtnTextActive,
                            ]}
                        >
                            {role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍👩‍👧 Parent'}
                        </AppText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function LoginScreen() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<AuthNav>();
    const [role, setRole] = useState<UserType>('parent');
    const [apiError, setApiError] = useState('');

    const [teacherLogin, { isLoading: teacherLoading }] = useTeacherLoginMutation();
    const [parentLogin, { isLoading: parentLoading }] = useParentLoginMutation();
    const isLoading = teacherLoading || parentLoading;

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: { email: '', password: '' },
        mode: 'onBlur',
    });

    const onSubmit = useCallback(
        async (values: LoginFormValues) => {
            setApiError('');
            try {
                const mutation = role === 'teacher' ? teacherLogin : parentLogin;
                const result = await mutation({
                    email: values.email.trim().toLowerCase(),
                    password: values.password,
                    schoolSlug: SCHOOL_SLUG,
                }).unwrap();

                const { accessToken, refreshToken, user } = result;

                // 1. Persist tokens to Keychain
                await storeTokens({ accessToken, refreshToken, userType: role });

                // 2. Hydrate Redux
                dispatch(setAuth({ accessToken, refreshToken, userType: role, user }));

                // 3. Navigate — root navigator re-renders but may not transition
                //    if the screen name doesn't change (e.g. Auth→Auth on isFirstLogin).
                //    Explicitly push within the Auth stack to ensure the user moves forward.
                if (user.isFirstLogin) {
                    navigation.navigate('ChangePassword' as any);
                }
                // When isFirstLogin=false, root navigator unmounts Auth and mounts Teacher/Parent
            } catch (err: any) {
                setApiError(parseLoginError(err));
            }
        },
        [role, teacherLogin, parentLogin, dispatch, navigation],
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <AppStatusBar variant="default" />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo + branding */}
                    <View style={styles.header}>
                        <View style={styles.logoBox}>
                            <AppText style={styles.logoEmoji}>🎓</AppText>
                        </View>
                        <AppText variant="h2" center style={styles.appName}>
                            SchoolBridge
                        </AppText>
                        <AppText variant="body1" secondary center>
                            Stay connected with school
                        </AppText>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>

                        {/* Role toggle */}
                        <AppText variant="label" secondary style={styles.fieldLabel}>
                            I am a
                        </AppText>
                        <RoleToggle selected={role} onChange={(r) => { setRole(r); setApiError(''); }} />

                        <View style={styles.form}>
                            {/* Email */}
                            <Controller
                                control={control}
                                name="email"
                                rules={{
                                    validate: composeValidators(required, validEmail),
                                }}
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <AppInput
                                        ref={ref}
                                        label="Email"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.email?.message}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                        placeholder="your@email.com"
                                        required
                                    />
                                )}
                            />

                            {/* Password */}
                            <Controller
                                control={control}
                                name="password"
                                rules={{ validate: composeValidators(required, minPasswordLength) }}
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <AppInput
                                        ref={ref}
                                        label="Password"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.password?.message}
                                        secureTextEntry
                                        showToggle
                                        autoCapitalize="none"
                                        autoComplete="password"
                                        returnKeyType="done"
                                        onSubmitEditing={handleSubmit(onSubmit)}
                                        placeholder="••••••••"
                                        required
                                    />
                                )}
                            />

                            {/* API error */}
                            {!!apiError && (
                                <View style={styles.apiError}>
                                    <AppText variant="body2" color={Colors.error}>
                                        {apiError}
                                    </AppText>
                                </View>
                            )}

                            {/* Submit */}
                            <AppButton
                                label={isLoading ? 'Signing in…' : 'Sign In'}
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                fullWidth
                                style={styles.submitBtn}
                            />
                        </View>
                    </View>

                    {/* Footer */}
                    <AppText variant="caption" secondary center style={styles.footer}>
                        Having trouble logging in?{'\n'}
                        Contact your school administrator.
                    </AppText>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: { flex: 1 },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Layout.screenPaddingH,
        paddingBottom: Spacing[10],
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing[8],
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius['2xl'],
        backgroundColor: Colors.primarySubtle,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing[4],
    },
    logoEmoji: {
        fontSize: 40,
    },
    appName: {
        marginBottom: Spacing[1],
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing[6],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    fieldLabel: {
        marginBottom: Spacing[2],
    },
    roleToggle: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.xl,
        padding: 3,
        marginBottom: Spacing[5],
    },
    roleBtn: {
        flex: 1,
        paddingVertical: Spacing[2],
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    roleBtnActive: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    roleBtnText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
    },
    roleBtnTextActive: {
        color: Colors.textPrimary,
        fontWeight: FontWeight.semiBold,
    },
    form: {
        gap: Spacing[4],
    },
    apiError: {
        backgroundColor: Colors.errorLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing[3],
        borderWidth: 1,
        borderColor: Colors.errorBorder,
    },
    submitBtn: {
        marginTop: Spacing[2],
    },
    footer: {
        marginTop: Spacing[6],
        lineHeight: 20,
    },
});