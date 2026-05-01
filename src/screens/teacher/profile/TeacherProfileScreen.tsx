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
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { useAuth } from '../../../hooks/useAuth';
import { useImagePicker } from '../../../hooks/useImagePicker';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast } from '../../../store/slices/uiSlice';
import { useGetMyClassesQuery } from '../../../services/teacher/classes.service';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../../constants/spacing';
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
        <CardRow onPress={onPress} bordered={!danger}>
            <View style={[styles.rowIconContainer, { backgroundColor: defaultIconColor + '15' }]}>
                <Icon
                    name={icon}
                    size={20}
                    color={defaultIconColor}
                />
            </View>
            <View style={styles.rowContent}>
                <AppText
                    variant="body1"
                    style={[styles.rowLabel, danger && { color: Colors.error, fontWeight: FontWeight.semiBold }]}
                >
                    {label}
                </AppText>
                {value && (
                    <AppText variant="caption" secondary>
                        {value}
                    </AppText>
                )}
            </View>
            {showChevron && onPress && !danger && (
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
                    <View style={styles.headerBg} />
                    <View style={styles.headerContent}>
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
                            <View style={styles.cameraOverlay}>
                                {isUploading ? (
                                    <Icon name="sync-outline" size={14} color={Colors.primary} />
                                ) : (
                                    <Icon name="camera" size={14} color={Colors.primary} />
                                )}
                            </View>
                        </TouchableOpacity>

                        <AppText variant="h3" center style={styles.name}>
                            {displayName}
                        </AppText>
                        <AppText variant="body2" secondary center>
                            {user?.email}
                        </AppText>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <AppText variant="h4" color={Colors.primary}>{classes.length}</AppText>
                                <AppText variant="caption" secondary>Classes</AppText>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <AppText variant="h4" color={Colors.success}>
                                    {classes.reduce((acc, c) => acc + c.studentCount, 0)}
                                </AppText>
                                <AppText variant="caption" secondary>Students</AppText>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <AppText variant="h4" color={Colors.warning}>
                                    {classes.filter(c => c.isClassTeacher).length}
                                </AppText>
                                <AppText variant="caption" secondary>Class Teacher</AppText>
                            </View>
                        </View>
                    </View>
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
                        icon="notifications-outline"
                        label="Notifications"
                        iconColor={Colors.primary}
                        value="All enabled"
                        onPress={() => navigation.navigate('NotificationInbox')}
                    />
                    <SettingsRow
                        icon="lock-closed-outline"
                        label="Change Password"
                        iconColor={Colors.warning}
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                    <SettingsRow
                        icon="phone-portrait-outline"
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
                        icon="help-circle-outline"
                        label="Help & FAQ"
                        iconColor={Colors.success}
                        onPress={() => {/* TODO */ }}
                    />
                    <SettingsRow
                        icon="mail-outline"
                        label="Support"
                        iconColor={Colors.parent}
                        value="support@schoolbridge.in"
                        onPress={() => {/* TODO: Linking.openURL mailto */ }}
                    />
                </AppCard>

                {/* ── Sign out ─────────────────────────────────────────────────── */}
                <View style={styles.signOutWrapper}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleLogout}
                        style={styles.signOutRow}
                    >
                        <View style={[styles.rowIconContainer, { backgroundColor: Colors.error + '15' }]}>
                            <Icon name="log-out-outline" size={20} color={Colors.error} />
                        </View>
                        <AppText variant="body1" style={styles.signOutText}>
                            {isLoggingOut ? 'Signing out…' : 'Sign Out'}
                        </AppText>
                    </TouchableOpacity>
                </View>

                <Spacer size={Spacing[10]} />
            </ScrollView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: Spacing[10],
    },
    profileHeader: {
        paddingTop: Spacing[4],
        paddingBottom: Spacing[6],
        paddingHorizontal: Layout.screenPaddingH,
    },
    headerBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        backgroundColor: Colors.primarySubtle,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: Spacing[4],
        padding: 4,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.full,
        elevation: 4,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        borderWidth: 3,
        borderColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    name: {
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing[4],
        paddingHorizontal: Spacing[2],
        marginTop: Spacing[6],
        width: '100%',
        elevation: 2,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.border,
    },
    card: {
        marginBottom: Spacing[4],
        marginHorizontal: Layout.screenPaddingH,
        overflow: 'hidden',
        borderRadius: BorderRadius.xl,
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
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primarySubtle,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    classBadgeText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
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
    rowIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[3],
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },
    // ── Sign out ──────────────────────────────────────────────────────────────
    signOutWrapper: {
        marginHorizontal: Layout.screenPaddingH,
        marginTop: Spacing[2],
    },
    signOutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing[4],
        elevation: 1,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    signOutText: {
        color: Colors.error,
        fontWeight: FontWeight.semiBold,
    },
});