import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/common/AppText';
import { AppInput } from '../../../components/common/AppInput';
import { AppButton } from '../../../components/common/AppButton';
import { AppStatusBar } from '../../../components/common/AppStatusBar';
import { Spacer } from '../../../components/layout/Divider';
import { useAppSelector } from '../../../app/store';
import { selectUserType } from '../../../store/slices/authSlice';
import { useUpdatePasswordMutation } from '../../../services/root/auth.service';
import {
    required,
    minPasswordLength,
    strongPassword,
    passwordsMatch,
    composeValidators,
} from '../../../utils/validation.utils';
import { Colors } from '../../../constants/colors';
import { Spacing, Layout, BorderRadius } from '../../../constants/spacing';
import { FontSize } from '../../../constants/typography';
import { useNavigation } from '@react-navigation/native';

// ─── Form shape ───────────────────────────────────────────────────────────────

interface UpdatePasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrengthIndicator({ password }: { password: string }) {
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
            <AppText style={[strengthStyles.label, { color: colours[score] }]}>
                {labels[score]}
            </AppText>
        </View>
    );
}

const strengthStyles = StyleSheet.create({
    container: { gap: Spacing[2], marginTop: Spacing[1] },
    bars: { flexDirection: 'row', gap: 4 },
    bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
    label: { fontSize: FontSize.xs, alignSelf: 'flex-end', marginTop: -Spacing[1] },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function UpdatePasswordScreen() {
    const navigation = useNavigation();
    const userType = useAppSelector(selectUserType);
    const [apiError, setApiError] = useState('');

    const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<UpdatePasswordFormValues>({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onBlur',
    });

    const watchedNewPassword = watch('newPassword');

    const onSubmit = useCallback(
        async (values: UpdatePasswordFormValues) => {
            setApiError('');
            try {
                await updatePassword({
                    userType: userType!,
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                }).unwrap();

                Alert.alert(
                    'Success',
                    'Your password has been changed successfully.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                reset();
            } catch (err: any) {
                const status = err?.status ?? err?.data?.statusCode;
                const message = err?.data?.message ?? err?.message;

                if (status === 401) {
                    setApiError('Current password is incorrect. Please try again.');
                } else if (typeof message === 'string') {
                    setApiError(message);
                } else {
                    setApiError('Failed to update password. Please try again.');
                }
            }
        },
        [updatePassword, userType, navigation, reset],
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
                    <View style={styles.intro}>
                        <AppText variant="body1" secondary>
                            Choose a strong password that you don't use elsewhere.
                            Passwords must be at least 8 characters long.
                        </AppText>
                    </View>

                    <View style={styles.card}>
                        {/* Current password */}
                        <Controller
                            control={control}
                            name="currentPassword"
                            rules={{ validate: required }}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <AppInput
                                    ref={ref}
                                    label="Current Password"
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

                        {/* New password */}
                        <Controller
                            control={control}
                            name="newPassword"
                            rules={{
                                validate: composeValidators(required, minPasswordLength, strongPassword),
                            }}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <View>
                                    <AppInput
                                        ref={ref}
                                        label="New Password"
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
                                </View>
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
                                    label="Confirm New Password"
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

                        <Spacer size={Spacing[4]} />

                        <AppButton
                            label={isLoading ? 'Updating…' : 'Update Password'}
                            onPress={handleSubmit(onSubmit)}
                            loading={isLoading}
                            fullWidth
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    scroll: {
        padding: Layout.screenPaddingH,
        paddingBottom: Spacing[10],
    },
    intro: {
        marginBottom: Spacing[6],
        marginTop: Spacing[2],
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing[5],
        gap: Spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    apiError: {
        backgroundColor: Colors.errorLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing[3],
        borderWidth: 1,
        borderColor: Colors.errorBorder,
    },
});
