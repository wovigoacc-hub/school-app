import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/common/AppText';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { AppStatusBar } from '../../components/common/AppStatusBar';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../components/layout/Divider';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
    clearFirstLogin,
    selectDisplayName,
    selectUserType,
} from '../../store/slices/authSlice';
import { useChangePasswordMutation } from '../../services/root/auth.service';
import {
    required,
    minPasswordLength,
    strongPassword,
    passwordsMatch,
    composeValidators,
} from '../../utils/validation.utils';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, BorderRadius } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

// ─── Form shape ───────────────────────────────────────────────────────────────

interface ChangePasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// ─── Password strength indicator ─────────────────────────────────────────────

interface StrengthIndicatorProps {
    password: string;
}

function PasswordStrengthIndicator({ password }: StrengthIndicatorProps) {
    const checks = [
        { label: 'At least 8 characters', pass: password.length >= 8 },
        { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
        { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
        { label: 'Number', pass: /\d/.test(password) },
    ];

    const score = checks.filter((c) => c.pass).length;
    const colours = ['', Colors.error, Colors.warning, Colors.warning, Colors.success];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    if (!password) return null;

    return (
        <View style={strengthStyles.container}>
            {/* Progress bars */}
            <View style={strengthStyles.bars}>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[
                            strengthStyles.bar,
                            i <= score && { backgroundColor: colours[score] },
                        ]}
                    />
                ))}
            </View>

            <AppText
                style={[strengthStyles.label, { color: colours[score] }]}
            >
                {labels[score]}
            </AppText>

            {/* Check list */}
            <View style={strengthStyles.checks}>
                {checks.map(({ label, pass }) => (
                    <View key={label} style={strengthStyles.checkRow}>
                        <AppText style={[strengthStyles.checkIcon, { color: pass ? Colors.success : Colors.border }]}>
                            {pass ? '✓' : '○'}
                        </AppText>
                        <AppText style={[strengthStyles.checkText, { color: pass ? Colors.textSecondary : Colors.textTertiary }]}>
                            {label}
                        </AppText>
                    </View>
                ))}
            </View>
        </View>
    );
}

const strengthStyles = StyleSheet.create({
    container: {
        gap: Spacing[2],
    },
    bars: {
        flexDirection: 'row',
        gap: 4,
    },
    bar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
    },
    label: {
        fontSize: FontSize.xs,
        alignSelf: 'flex-end',
        marginTop: -Spacing[1],
    },
    checks: {
        gap: Spacing[1],
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    checkIcon: {
        fontSize: FontSize.sm,
        width: 14,
    },
    checkText: {
        fontSize: FontSize.xs,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ChangePasswordScreen() {
    const dispatch = useAppDispatch();
    const displayName = useAppSelector(selectDisplayName);
    const userType = useAppSelector(selectUserType);
    const [apiError, setApiError] = useState('');

    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onBlur',
    });

    const watchedNewPassword = watch('newPassword');

    const onSubmit = useCallback(
        async (values: ChangePasswordFormValues) => {
            setApiError('');
            try {
                await changePassword({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                }).unwrap();

                // Dispatch — RootNavigator watches isFirstLogin and will navigate away
                dispatch(clearFirstLogin());
            } catch (err: any) {
                const status = err?.status ?? err?.data?.statusCode;
                const message = err?.data?.message ?? err?.message;

                if (status === 401) {
                    setApiError('Your current password is incorrect. Please try again.');
                } else if (typeof message === 'string') {
                    setApiError(message);
                } else {
                    setApiError('Failed to update password. Please try again.');
                }
            }
        },
        [changePassword, dispatch],
    );

    const roleLabel = userType === 'teacher' ? 'Teacher' : 'Parent';

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
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconBox}>
                            <AppText style={styles.iconEmoji}>🔐</AppText>
                        </View>
                        <AppText variant="h3" center style={styles.title}>
                            Set Your Password
                        </AppText>
                        <AppText variant="body1" secondary center style={styles.subtitle}>
                            Welcome, {displayName || roleLabel}!{'\n'}
                            Please create a new password to continue.
                        </AppText>
                    </View>

                    {/* Cannot skip notice */}
                    <View style={styles.noticeBanner}>
                        <AppText style={styles.noticeText}>
                            🔒 For your security, you must set a personal password before using the app.
                        </AppText>
                    </View>

                    {/* Form card */}
                    <View style={styles.card}>

                        {/* Current (temporary) password */}
                        <Controller
                            control={control}
                            name="currentPassword"
                            rules={{ validate: required }}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <AppInput
                                    ref={ref}
                                    label="Temporary password"
                                    hint="The password sent to you by your school"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.currentPassword?.message}
                                    secureTextEntry
                                    showToggle
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    required
                                />
                            )}
                        />

                        <Divider style={styles.divider} />

                        {/* New password */}
                        <Controller
                            control={control}
                            name="newPassword"
                            rules={{
                                validate: composeValidators(required, minPasswordLength, strongPassword),
                            }}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <>
                                    <AppInput
                                        ref={ref}
                                        label="New password"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.newPassword?.message}
                                        secureTextEntry
                                        showToggle
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        required
                                    />
                                    <PasswordStrengthIndicator password={value} />
                                </>
                            )}
                        />

                        {/* Confirm password */}
                        <Controller
                            control={control}
                            name="confirmPassword"
                            rules={{
                                validate: composeValidators(
                                    required,
                                    passwordsMatch(watchedNewPassword),
                                ),
                            }}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <AppInput
                                    ref={ref}
                                    label="Confirm new password"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.confirmPassword?.message}
                                    secureTextEntry
                                    showToggle
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit(onSubmit)}
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
                            label={isLoading ? 'Saving…' : 'Set Password & Continue'}
                            onPress={handleSubmit(onSubmit)}
                            loading={isLoading}
                            fullWidth
                            style={styles.submitBtn}
                        />
                    </View>

                    <Spacer size={Spacing[8]} />
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
        padding: Layout.screenPaddingH,
        paddingTop: Spacing[6],
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing[5],
    },
    iconBox: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius['2xl'],
        backgroundColor: Colors.warningLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing[4],
    },
    iconEmoji: {
        fontSize: 36,
    },
    title: {
        marginBottom: Spacing[2],
    },
    subtitle: {
        lineHeight: 22,
        maxWidth: 280,
        textAlign: 'center',
    },
    noticeBanner: {
        backgroundColor: Colors.warningLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing[3],
        borderWidth: 1,
        borderColor: Colors.warningBorder,
        marginBottom: Spacing[5],
    },
    noticeText: {
        fontSize: FontSize.sm,
        color: Colors.warning,
        lineHeight: 18,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing[6],
        gap: Spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    divider: {
        marginVertical: Spacing[1],
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
});