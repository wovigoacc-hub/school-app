import React, { useCallback, useState } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { SectionHeader } from '../../../components/layout/SectionHeader';
import { Divider, Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppCard, CardRow } from '../../../components/common/AppCard';
import { AppAvatar } from '../../../components/common/AppAvatar';
import { AppButton } from '../../../components/common/AppButton';
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { useAuth } from '../../../hooks/useAuth';
import { useImagePicker } from '../../../hooks/useImagePicker';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast, showModal } from '../../../store/slices/uiSlice';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, AvatarSize, Spacing, Layout } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import type { Language } from '../../../types/auth.types';
import { BUILD_FLAGS } from '../../../constants/config';

// ─── Language config ──────────────────────────────────────────────────────────

const LANGUAGES: Array<{ value: Language; label: string; native: string }> = [
    { value: 'ENGLISH', label: 'English', native: 'English' },
    { value: 'TAMIL', label: 'Tamil', native: 'தமிழ்' },
    { value: 'MALAYALAM', label: 'Malayalam', native: 'മലയാളം' },
];

// ─── Row item helper ──────────────────────────────────────────────────────────

interface SettingsRowProps {
    icon: string;
    label: string;
    iconColor?: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
}

function SettingsRow({
    icon, label, value, onPress, iconColor,
    showChevron = true, danger = false,
}: SettingsRowProps) {
    const defaultIconColor = danger ? Colors.error : (iconColor ?? Colors.textSecondary);

    return (
        <CardRow onPress={onPress} bordered>
            <Icon
                name={icon}
                size={22}
                color={defaultIconColor}
                style={styles.rowIcon}
            />
            <AppText
                variant="body1"
                style={[styles.rowLabel, danger && { color: Colors.error }]}
            >
                {label}
            </AppText>
            {value && (
                <AppText variant="body2" secondary style={styles.rowValue}>
                    {value}
                </AppText>
            )}
            {showChevron && onPress && (
                <Icon name="chevron-forward" size={18} color={Colors.textTertiary} />
            )}
        </CardRow>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TeacherProfileScreen() {
    const dispatch = useAppDispatch();
    const {
        user,
        displayName,
        preferredLang,
        isTeacher,
        logout,
        updateLocalProfile,
    } = useAuth();

    const { data: classesData, refetch: refetchClasses } = useGetMyClassesQuery();
    const classes = classesData?.data ?? [];

    const { uploadImage, isUploading } = useImagePicker();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigation = useNavigation<any>();
    const { refreshing, onRefresh } = useRefresh(refetchClasses);

    // ─── Photo upload ──────────────────────────────────────────────────────────
    const handlePhotoPress = useCallback(() => {
        Alert.alert(
            'Update Profile Photo',
            'Choose a photo source',
            [
                {
                    text: 'Camera',
                    onPress: async () => {
                        const result = await uploadImage('PROFILE_PHOTO', 'camera');
                        if (result) {
                            updateLocalProfile({ photoUrl: result.url });
                            dispatch(showSuccessToast('Profile photo updated'));
                        }
                    },
                },
                {
                    text: 'Photo Library',
                    onPress: async () => {
                        const result = await uploadImage('PROFILE_PHOTO', 'gallery');
                        if (result) {
                            updateLocalProfile({ photoUrl: result.url });
                            dispatch(showSuccessToast('Profile photo updated'));
                        }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ],
        );
    }, [uploadImage, updateLocalProfile, dispatch]);

    // ─── Language change ───────────────────────────────────────────────────────
    const handleLanguageChange = useCallback(
        (lang: Language) => {
            updateLocalProfile({ preferredLang: lang });
            dispatch(showSuccessToast('Language updated'));
        },
        [updateLocalProfile, dispatch],
    );

    // ─── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = useCallback(() => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        await logout();
                        // RootNavigator automatically redirects to Auth
                    },
                },
            ],
        );
    }, [logout]);

    return (
        <ScreenWrapper statusBar="teacher" noKeyboard>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* ── Profile header ─────────────────────────────────────────── */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handlePhotoPress}
                        style={styles.avatarWrapper}
                        accessibilityRole="button"
                        accessibilityLabel="Change profile photo"
                    >
                        <AppAvatar
                            firstName={user?.firstName ?? ''}
                            lastName={user?.lastName}
                            photoUrl={user?.photoUrl}
                            size="2xl"
                        />
                        {/* Camera overlay */}
                        <View style={styles.cameraOverlay}>
                            {isUploading ? (
                                <Icon name="sync-outline" size={14} color={Colors.teacher} />
                            ) : (
                                <Icon name="camera" size={14} color={Colors.teacher} />
                            )}
                        </View>
                    </TouchableOpacity>

                    <AppText variant="h3" center style={styles.name}>
                        {displayName}
                    </AppText>
                    <AppText variant="body2" secondary center>
                        {user?.email}
                    </AppText>

                    {/* Class count pill */}
                    {classes.length > 0 && (
                        <View style={styles.classPill}>
                            <View style={styles.classPillContent}>
                                <Icon name="school" size={16} color={Colors.teacher} />
                                <AppText style={styles.classPillText}>
                                    {classes.length} class{classes.length > 1 ? 'es' : ''}
                                </AppText>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── My classes ─────────────────────────────────────────────── */}
                {classes.length > 0 && (
                    <>
                        <SectionHeader title="My Classes" compact />
                        <AppCard noPadding style={styles.card}>
                            {classes.map((cls, i) => (
                                <View key={cls.classId}>
                                    <View style={styles.classRow}>
                                        <View style={styles.classBadge}>
                                            <AppText style={styles.classBadgeText}>
                                                {cls.name.charAt(0)}{cls.section}
                                            </AppText>
                                        </View>
                                        <View style={styles.classInfo}>
                                            <AppText variant="subtitle2">
                                                {cls.name} {cls.section}
                                            </AppText>
                                            <AppText variant="caption" secondary>
                                                {cls.studentCount} students
                                                {cls.isClassTeacher ? ' · Class Teacher' : ''}
                                            </AppText>
                                            {cls.mySubjects.length > 0 && (
                                                <AppText variant="caption" tertiary numberOfLines={1}>
                                                    {cls.mySubjects.map((s) => s.subjectName).join(', ')}
                                                </AppText>
                                            )}
                                        </View>
                                    </View>
                                    {i < classes.length - 1 && <Divider indent={Spacing[4]} />}
                                </View>
                            ))}
                        </AppCard>
                    </>
                )}

                {/* ── Language preference ─────────────────────────────────────── */}
                <SectionHeader title="Language" compact />
                <AppCard noPadding style={styles.card}>
                    <View style={styles.langInner}>
                        <View style={styles.langChips}>
                            {LANGUAGES.map((lang) => (
                                <AppChip
                                    key={lang.value}
                                    label={lang.native}
                                    selected={preferredLang === lang.value}
                                    onPress={() => handleLanguageChange(lang.value)}
                                    size="md"
                                />
                            ))}
                        </View>
                        <AppText variant="caption" secondary style={styles.langHint}>
                            Changes how dates and text appear throughout the app
                        </AppText>
                    </View>
                </AppCard>

                {/* ── Account ─────────────────────────────────────────────────── */}
                <SectionHeader title="Account" compact />
                <AppCard noPadding style={styles.card}>
                    <SettingsRow
                        icon="notifications"
                        label="Notifications"
                        iconColor={Colors.teacher}
                        value="All enabled"
                        onPress={() => navigation.navigate('NotificationInbox')}
                    />
                    <SettingsRow
                        icon="lock-closed"
                        label="Change Password"
                        iconColor={Colors.warning}
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                    <SettingsRow
                        icon="phone-portrait"
                        label="App Version"
                        iconColor={Colors.textTertiary}
                        value={BUILD_FLAGS.IS_DEV ? 'Dev build' : '1.0.0'}
                        onPress={undefined}
                        showChevron={false}
                    />
                </AppCard>

                {/* ── Support ─────────────────────────────────────────────────── */}
                <SectionHeader title="Support" compact />
                <AppCard noPadding style={styles.card}>
                    <SettingsRow
                        icon="help-circle"
                        label="Help & FAQ"
                        iconColor={Colors.success}
                        onPress={() => {/* TODO */ }}
                    />
                    <SettingsRow
                        icon="mail"
                        label="Support"
                        iconColor={Colors.parent}
                        value="support@schoolbridge.in"
                        onPress={() => {/* TODO: Linking.openURL mailto */ }}
                    />
                </AppCard>

                {/* ── Sign out ─────────────────────────────────────────────────── */}
                <Spacer size={Spacing[4]} />
                <AppButton
                    label={isLoggingOut ? 'Signing out…' : 'Sign Out'}
                    variant="secondary"
                    leftIcon={<Icon name="log-out-outline" size={20} color={Colors.error} />}
                    loading={isLoggingOut}
                    onPress={handleLogout}
                    fullWidth
                    textStyle={{ color: Colors.error }}
                    style={styles.signOutBtn}
                />

                <Spacer size={Spacing[10]} />
            </ScrollView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = AvatarSize['2xl']; // 80

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: Spacing[10],
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: Spacing[6],
        paddingBottom: Spacing[5],
        gap: Spacing[2],
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: Spacing[2],
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraEmoji: { fontSize: 14 },
    name: { marginTop: Spacing[1] },
    classPill: {
        marginTop: Spacing[1],
        backgroundColor: Colors.teacherLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1.5],
    },
    classPillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[1.5],
    },
    classPillText: {
        fontSize: FontSize.sm,
        color: Colors.teacher,
        fontWeight: FontWeight.medium,
    },
    card: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    // ── Class rows ──────────────────────────────────────────────────────────
    classRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        gap: Spacing[3],
    },
    classBadge: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.teacherLight,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    classBadgeText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.teacher,
    },
    classInfo: { flex: 1, gap: 2 },
    // ── Language ─────────────────────────────────────────────────────────────
    langInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    langChips: {
        flexDirection: 'row',
        gap: Spacing[3],
    },
    langHint: { marginTop: Spacing[1] },
    // ── Settings rows ─────────────────────────────────────────────────────────
    rowIcon: { marginRight: Spacing[3] },
    rowLabel: { flex: 1 },
    rowValue: { marginRight: Spacing[1] },
    // ── Sign out ──────────────────────────────────────────────────────────────
    signOutBtn: {
        borderColor: Colors.errorBorder,
    },
});