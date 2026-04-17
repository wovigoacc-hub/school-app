import React, { useCallback, useState } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Switch,
} from 'react-native';
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
import { useActiveChild } from '../../../hooks/useActiveChild';
import { useImagePicker } from '../../../hooks/useImagePicker';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast, showErrorToast } from '../../../store/slices/uiSlice';
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

// ─── Settings row ─────────────────────────────────────────────────────────────

interface SettingsRowProps {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
    rightElement?: React.ReactNode;
}

function SettingsRow({
    icon, label, value, onPress,
    showChevron = true, danger = false, rightElement,
}: SettingsRowProps) {
    return (
        <CardRow onPress={onPress} bordered>
            <AppText style={styles.rowIcon}>{icon}</AppText>
            <AppText
                variant="body1"
                style={[styles.rowLabel, danger && { color: Colors.error }]}
            >
                {label}
            </AppText>
            {rightElement ?? (
                <>
                    {value && (
                        <AppText variant="body2" secondary style={styles.rowValue}>
                            {value}
                        </AppText>
                    )}
                    {showChevron && onPress && (
                        <AppText secondary style={styles.chevron}>›</AppText>
                    )}
                </>
            )}
        </CardRow>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ParentProfileScreen() {
    const dispatch = useAppDispatch();
    const {
        user,
        displayName,
        preferredLang,
        logout,
        updateLocalProfile,
    } = useAuth();

    const { children } = useActiveChild();
    const { uploadImage, isUploading } = useImagePicker();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Local notification pref state — would normally come from a profile query
    const [muteHomework, setMuteHomework] = useState(false);
    const [muteSummary, setMuteSummary] = useState(false);

    // Dummy refetch for pull-to-refresh (would refetch profile in production)
    const { refreshing, onRefresh } = useRefresh(async () => { });

    // ─── Photo upload ──────────────────────────────────────────────────────
    const handlePhotoPress = useCallback(() => {
        Alert.alert(
            'Update Profile Photo',
            'Choose a source',
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

    // ─── Language ──────────────────────────────────────────────────────────
    const handleLanguageChange = useCallback(
        (lang: Language) => {
            updateLocalProfile({ preferredLang: lang });
            dispatch(showSuccessToast('Language updated'));
        },
        [updateLocalProfile, dispatch],
    );

    // ─── Logout ────────────────────────────────────────────────────────────
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
        <ScreenWrapper statusBar="parent" noKeyboard>
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
                        <View style={styles.cameraOverlay}>
                            <AppText style={styles.cameraEmoji}>
                                {isUploading ? '⏳' : '📷'}
                            </AppText>
                        </View>
                    </TouchableOpacity>

                    <AppText variant="h3" center style={styles.name}>
                        {displayName}
                    </AppText>
                    <AppText variant="body2" secondary center>
                        {user?.email}
                    </AppText>

                    {/* Children count pill */}
                    {children.length > 0 && (
                        <View style={styles.childrenPill}>
                            <AppText style={styles.childrenPillText}>
                                👨‍👩‍👧 {children.length} child{children.length > 1 ? 'ren' : ''}
                            </AppText>
                        </View>
                    )}
                </View>

                {/* ── My children ──────────────────────────────────────────────── */}
                {children.length > 0 && (
                    <>
                        <SectionHeader title="My Children" compact />
                        <AppCard noPadding style={styles.card}>
                            {children.map((child, i) => (
                                <View key={child.studentId}>
                                    <View style={styles.childRow}>
                                        <AppAvatar
                                            firstName={child.firstName}
                                            lastName={child.lastName}
                                            photoUrl={child.photoUrl}
                                            size="sm"
                                            style={styles.childAvatar}
                                        />
                                        <View style={styles.childInfo}>
                                            <AppText variant="subtitle2">
                                                {child.firstName} {child.lastName}
                                            </AppText>
                                            <AppText variant="caption" secondary>
                                                {child.className} {child.section}
                                                {child.isPrimary ? ' · Primary' : ''}
                                            </AppText>
                                            {child.relation && (
                                                <AppText variant="caption" tertiary>
                                                    {child.relation}
                                                </AppText>
                                            )}
                                        </View>
                                        {child.isActive ? (
                                            <View style={styles.activePill}>
                                                <AppText style={styles.activePillText}>Active</AppText>
                                            </View>
                                        ) : (
                                            <AppText variant="caption" tertiary>Inactive</AppText>
                                        )}
                                    </View>
                                    {i < children.length - 1 && (
                                        <Divider indent={Layout.screenPaddingH} />
                                    )}
                                </View>
                            ))}
                        </AppCard>
                    </>
                )}

                {/* ── Language ─────────────────────────────────────────────────── */}
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

                {/* ── Notification preferences ──────────────────────────────────── */}
                <SectionHeader title="Notifications" compact />
                <AppCard noPadding style={styles.card}>
                    {/* Attendance alerts — always ON */}
                    <CardRow bordered>
                        <AppText style={styles.rowIcon}>🔴</AppText>
                        <View style={styles.notifText}>
                            <AppText variant="body1">Absence Alerts</AppText>
                            <AppText variant="caption" secondary>
                                When your child is marked absent
                            </AppText>
                        </View>
                        <AppText variant="caption" color={Colors.success}>
                            Always on
                        </AppText>
                    </CardRow>

                    {/* Emergency broadcasts — always ON */}
                    <CardRow bordered>
                        <AppText style={styles.rowIcon}>🚨</AppText>
                        <View style={styles.notifText}>
                            <AppText variant="body1">Emergency Alerts</AppText>
                            <AppText variant="caption" secondary>
                                School emergency broadcasts
                            </AppText>
                        </View>
                        <AppText variant="caption" color={Colors.success}>
                            Always on
                        </AppText>
                    </CardRow>

                    {/* Homework reminders — toggleable */}
                    <CardRow bordered>
                        <AppText style={styles.rowIcon}>📚</AppText>
                        <View style={styles.notifText}>
                            <AppText variant="body1">Homework Reminders</AppText>
                            <AppText variant="caption" secondary>
                                Reminders for pending homework
                            </AppText>
                        </View>
                        <Switch
                            value={!muteHomework}
                            onValueChange={(val) => setMuteHomework(!val)}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.white}
                            accessibilityLabel="Toggle homework reminders"
                        />
                    </CardRow>

                    {/* Weekly summary — toggleable */}
                    <CardRow>
                        <AppText style={styles.rowIcon}>📊</AppText>
                        <View style={styles.notifText}>
                            <AppText variant="body1">Weekly Summary</AppText>
                            <AppText variant="caption" secondary>
                                Weekly attendance & homework digest
                            </AppText>
                        </View>
                        <Switch
                            value={!muteSummary}
                            onValueChange={(val) => setMuteSummary(!val)}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.white}
                            accessibilityLabel="Toggle weekly summary"
                        />
                    </CardRow>
                </AppCard>

                {/* ── Account ──────────────────────────────────────────────────── */}
                <SectionHeader title="Account" compact />
                <AppCard noPadding style={styles.card}>
                    <SettingsRow
                        icon="🔐"
                        label="Change Password"
                        onPress={() => {/* TODO */ }}
                    />
                    <SettingsRow
                        icon="📱"
                        label="App Version"
                        value={BUILD_FLAGS.IS_DEV ? 'Dev build' : '1.0.0'}
                        onPress={undefined}
                        showChevron={false}
                    />
                </AppCard>

                {/* ── Support ──────────────────────────────────────────────────── */}
                <SectionHeader title="Support" compact />
                <AppCard noPadding style={styles.card}>
                    <SettingsRow
                        icon="❓"
                        label="Help & FAQ"
                        onPress={() => {/* TODO */ }}
                    />
                    <SettingsRow
                        icon="✉️"
                        label="Contact Support"
                        value="support@schoolbridge.in"
                        onPress={() => {/* TODO: Linking.openURL mailto */ }}
                    />
                </AppCard>

                {/* ── Sign out ─────────────────────────────────────────────────── */}
                <Spacer size={Spacing[4]} />
                <AppButton
                    label={isLoggingOut ? 'Signing out…' : 'Sign Out'}
                    variant="secondary"
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
    childrenPill: {
        marginTop: Spacing[1],
        backgroundColor: Colors.parentLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    childrenPillText: {
        fontSize: FontSize.sm,
        color: Colors.parent,
        fontWeight: FontWeight.medium,
    },
    card: {
        marginBottom: Spacing[4],
        overflow: 'hidden',
    },
    // ── Child rows ─────────────────────────────────────────────────────────
    childRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        gap: Spacing[3],
    },
    childAvatar: { flexShrink: 0 },
    childInfo: { flex: 1, gap: 2 },
    activePill: {
        backgroundColor: Colors.successLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
    },
    activePillText: {
        fontSize: FontSize.xs,
        color: Colors.success,
        fontWeight: FontWeight.medium,
    },
    // ── Language ───────────────────────────────────────────────────────────
    langInner: {
        padding: Spacing[4],
        gap: Spacing[3],
    },
    langChips: {
        flexDirection: 'row',
        gap: Spacing[3],
    },
    langHint: { marginTop: Spacing[1] },
    // ── Notification prefs ─────────────────────────────────────────────────
    notifText: {
        flex: 1,
        gap: 2,
    },
    // ── Settings rows ──────────────────────────────────────────────────────
    rowIcon: { fontSize: FontSize.lg, marginRight: Spacing[3] },
    rowLabel: { flex: 1 },
    rowValue: { marginRight: Spacing[1] },
    chevron: { fontSize: FontSize.xl },
    // ── Sign out ───────────────────────────────────────────────────────────
    signOutBtn: {
        borderColor: Colors.errorBorder,
    },
});