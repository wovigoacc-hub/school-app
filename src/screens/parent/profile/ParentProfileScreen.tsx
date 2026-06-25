import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Switch,
    Platform,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
import { AppAvatar } from '../../../components/common/AppAvatar';
import { AppChip } from '../../../components/common/AppChip';
import { AppRefreshControl, useRefresh } from '../../../components/common/AppRefreshControl';
import { useAuth } from '../../../hooks/useAuth';
import { useActiveChild } from '../../../hooks/useActiveChild';
import { useImagePicker } from '../../../hooks/useImagePicker';
import { useAppDispatch } from '../../../app/store';
import { showSuccessToast } from '../../../store/slices/uiSlice';
import { Colors } from '../../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../../constants/spacing';
import { FontSize, FontWeight } from '../../../constants/typography';
import type { Language } from '../../../types/auth.types';
import { BUILD_FLAGS } from '../../../constants/config';
import Icon from 'react-native-vector-icons/Ionicons';
import type { ParentNavigatorParamList } from '../../../navigation/types';

// ─── Language config ──────────────────────────────────────────────────────────

const LANGUAGES: Array<{ value: Language; label: string; native: string }> = [
    { value: 'ENGLISH', label: 'English', native: 'English' },
    { value: 'TAMIL', label: 'Tamil', native: 'தமிழ்' },
    { value: 'MALAYALAM', label: 'Malayalam', native: 'മലയാളം' },
];

// ─── Reusable row component ───────────────────────────────────────────────────

interface ProfileRowProps {
    icon: string;
    iconColor: string;
    iconBg: string;
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
    isLast?: boolean;
}

function ProfileRow({
    icon, iconColor, iconBg, label, value,
    onPress, rightElement, danger = false, isLast = false,
}: ProfileRowProps) {
    const inner = (
        <View style={[styles.rowInner, !isLast && styles.rowBorder]}>
            {/* Icon bubble */}
            <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={18} color={iconColor} />
            </View>

            {/* Label + optional value */}
            <View style={styles.rowContent}>
                <AppText
                    variant="body1"
                    style={[styles.rowLabel, danger && { color: Colors.error }]}
                    numberOfLines={1}
                >
                    {label}
                </AppText>
                {value !== undefined && (
                    <AppText variant="caption" secondary numberOfLines={1} style={styles.rowValue}>
                        {value}
                    </AppText>
                )}
            </View>

            {/* Right element or chevron */}
            {rightElement ?? (
                onPress && (
                    <Icon
                        name="chevron-forward"
                        size={16}
                        color={Colors.textTertiary}
                        style={styles.chevron}
                    />
                )
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={label}
            >
                {inner}
            </TouchableOpacity>
        );
    }
    return inner;
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

interface SectionCardProps {
    title: string;
    icon: string;
    iconColor: string;
    children: React.ReactNode;
}

function SectionCard({ title, icon, iconColor, children }: SectionCardProps) {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Icon name={icon} size={14} color={iconColor} style={{ marginRight: 6 }} />
                <AppText style={[styles.sectionTitle, { color: iconColor }]}>
                    {title.toUpperCase()}
                </AppText>
            </View>
            <View style={styles.sectionBody}>
                {children}
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ParentProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ParentNavigatorParamList>>();
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
    const [muteHomework, setMuteHomework] = useState(false);
    const [muteSummary, setMuteSummary] = useState(false);

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
        <ScreenWrapper statusBar="parent" noKeyboard noPadding>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* ── Hero header ───────────────────────────────────────────── */}
                <View style={styles.hero}>
                    <View style={styles.heroBg} />

                    {/* Avatar with camera badge */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handlePhotoPress}
                        style={styles.avatarWrapper}
                        accessibilityRole="button"
                        accessibilityLabel="Change profile photo"
                    >
                        <View style={styles.avatarRing}>
                            <AppAvatar
                                firstName={user?.firstName ?? ''}
                                lastName={user?.lastName}
                                photoUrl={user?.photoUrl}
                                size="2xl"
                            />
                        </View>
                        <View style={styles.cameraBadge}>
                            <Icon
                                name={isUploading ? 'refresh' : 'camera'}
                                size={13}
                                color={Colors.white}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Name + email */}
                    <AppText variant="h3" center style={styles.heroName}>
                        {displayName}
                    </AppText>
                    <AppText variant="body2" center style={styles.heroEmail}>
                        {user?.email}
                    </AppText>

                    {/* Children pill row */}
                    {children.length > 0 && (
                        <View style={styles.pillRow}>
                            <View style={styles.pill}>
                                <Icon name="people" size={12} color={Colors.parent} />
                                <AppText style={styles.pillText}>
                                    {children.length} {children.length > 1 ? 'children' : 'child'}
                                </AppText>
                            </View>
                            <View style={[styles.pill, styles.pillBlue]}>
                                <Icon name="school" size={12} color={Colors.primary} />
                                <AppText style={[styles.pillText, { color: Colors.primary }]}>
                                    Parent
                                </AppText>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.body}>

                    {/* ── My Children ──────────────────────────────────────────── */}
                    {children.length > 0 && (
                        <SectionCard title="My Children" icon="people-circle" iconColor="#8b5cf6">
                            {children.map((child, i) => (
                                <View key={child.studentId}>
                                    <View style={[styles.childRow, i < children.length - 1 && styles.rowBorder]}>
                                        <AppAvatar
                                            firstName={child.firstName}
                                            lastName={child.lastName}
                                            photoUrl={child.photoUrl}
                                            size="sm"
                                        />
                                        <View style={styles.childInfo}>
                                            <AppText variant="subtitle2">
                                                {child.firstName} {child.lastName}
                                            </AppText>
                                            <AppText variant="caption" secondary>
                                                {child.className} · Sec {child.section}
                                            </AppText>
                                            {child.relation && (
                                                <AppText variant="caption" style={styles.relationText}>
                                                    {child.relation}
                                                </AppText>
                                            )}
                                        </View>
                                        <View style={styles.childBadges}>
                                            {child.isPrimary && (
                                                <View style={styles.primaryBadge}>
                                                    <AppText style={styles.primaryBadgeText}>Primary</AppText>
                                                </View>
                                            )}
                                            <View style={child.isActive ? styles.activeBadge : styles.inactiveBadge}>
                                                <AppText style={child.isActive ? styles.activeBadgeText : styles.inactiveBadgeText}>
                                                    {child.isActive ? 'Active' : 'Inactive'}
                                                </AppText>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </SectionCard>
                    )}

                    {/* ── Language ─────────────────────────────────────────────── */}
                    <SectionCard title="Language" icon="language" iconColor="#06b6d4">
                        <View style={styles.langInner}>
                            <AppText variant="body2" secondary style={{ marginBottom: Spacing[3] }}>
                                Select your preferred language for the app
                            </AppText>
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
                        </View>
                    </SectionCard>

                    {/* ── Notifications ─────────────────────────────────────────── */}
                    <SectionCard title="Notifications" icon="notifications-circle" iconColor="#f59e0b">
                        <ProfileRow
                            icon="alert-circle"
                            iconColor="#ef4444"
                            iconBg="#fef2f2"
                            label="Absence Alerts"
                            value="When your child is marked absent"
                            rightElement={
                                <View style={styles.alwaysOnBadge}>
                                    <Icon name="shield-checkmark" size={11} color={Colors.success} />
                                    <AppText style={styles.alwaysOnText}>Always on</AppText>
                                </View>
                            }
                        />
                        <ProfileRow
                            icon="warning"
                            iconColor="#b45309"
                            iconBg="#fffbeb"
                            label="Emergency Alerts"
                            value="School emergency broadcasts"
                            rightElement={
                                <View style={styles.alwaysOnBadge}>
                                    <Icon name="shield-checkmark" size={11} color={Colors.success} />
                                    <AppText style={styles.alwaysOnText}>Always on</AppText>
                                </View>
                            }
                        />
                        <ProfileRow
                            icon="book"
                            iconColor="#f59e0b"
                            iconBg="#fffbeb"
                            label="Homework Reminders"
                            value="Reminders for pending homework"
                            rightElement={
                                <Switch
                                    value={!muteHomework}
                                    onValueChange={(val) => setMuteHomework(!val)}
                                    trackColor={{ false: Colors.border, true: Colors.parent }}
                                    thumbColor={Colors.white}
                                    accessibilityLabel="Toggle homework reminders"
                                />
                            }
                        />
                        <ProfileRow
                            icon="stats-chart"
                            iconColor="#8b5cf6"
                            iconBg="#faf5ff"
                            label="Weekly Summary"
                            value="Attendance & homework digest"
                            isLast
                            rightElement={
                                <Switch
                                    value={!muteSummary}
                                    onValueChange={(val) => setMuteSummary(!val)}
                                    trackColor={{ false: Colors.border, true: Colors.parent }}
                                    thumbColor={Colors.white}
                                    accessibilityLabel="Toggle weekly summary"
                                />
                            }
                        />
                    </SectionCard>

                    {/* ── School ───────────────────────────────────────────────── */}
                    <SectionCard title="School" icon="school" iconColor="#8b5cf6">
                        <ProfileRow
                            icon="calendar"
                            iconColor="#16a34a"
                            iconBg="#f0fdf4"
                            label="School Diary"
                            value="Holidays, exams, events & more"
                            isLast
                            onPress={() => navigation.navigate('SchoolDiary')}
                        />
                    </SectionCard>

                    {/* ── Account ──────────────────────────────────────────────── */}
                    <SectionCard title="Account" icon="person-circle" iconColor="#3b82f6">
                        <ProfileRow
                            icon="lock-closed"
                            iconColor="#3b82f6"
                            iconBg="#eff6ff"
                            label="Change Password"
                            value="Update your account password"
                            onPress={() => navigation.navigate('UpdatePassword')}
                        />
                        <ProfileRow
                            icon="phone-portrait"
                            iconColor="#6b7280"
                            iconBg="#f3f4f6"
                            label="App Version"
                            value={BUILD_FLAGS.IS_DEV ? 'Dev build' : '1.0.0'}
                            isLast
                        />
                    </SectionCard>

                    {/* ── Support ───────────────────────────────────────────────── */}
                    <SectionCard title="Support" icon="help-buoy" iconColor="#22c55e">
                        <ProfileRow
                            icon="help-circle"
                            iconColor="#22c55e"
                            iconBg="#f0fdf4"
                            label="Help & FAQ"
                            value="Guides and common questions"
                            onPress={() => {/* TODO */ }}
                        />
                        <ProfileRow
                            icon="mail"
                            iconColor="#06b6d4"
                            iconBg="#ecfeff"
                            label="Contact Support"
                            value="support@schoolbridge.in"
                            isLast
                            onPress={() => {/* TODO: Linking.openURL mailto */ }}
                        />
                    </SectionCard>

                    {/* ── Sign Out ──────────────────────────────────────────────── */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleLogout}
                        style={styles.signOutBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Sign out"
                        disabled={isLoggingOut}
                    >
                        <View style={styles.signOutInner}>
                            <View style={styles.signOutIcon}>
                                <Icon name="log-out" size={18} color="#ef4444" />
                            </View>
                            <AppText style={styles.signOutLabel}>
                                {isLoggingOut ? 'Signing out…' : 'Sign Out'}
                            </AppText>
                        </View>
                    </TouchableOpacity>

                    <Spacer size={Spacing[10]} />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
        alignItems: 'center',
        paddingBottom: Spacing[8],
        paddingTop: Spacing[2],
    },
    heroBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 130,
        backgroundColor: '#f3e8ff',   // purple-100
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    avatarWrapper: {
        marginTop: Spacing[6],
        marginBottom: Spacing[3],
        position: 'relative',
    },
    avatarRing: {
        padding: 3,
        borderRadius: 999,
        backgroundColor: Colors.white,
        // Shadow
        ...Platform.select({
            ios: {
                shadowColor: Colors.parent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
            },
            android: { elevation: 6 },
        }),
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.parent,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    heroName: {
        marginBottom: Spacing[1],
        color: Colors.textPrimary,
    },
    heroEmail: {
        color: Colors.textSecondary,
        marginBottom: Spacing[3],
    },
    pillRow: {
        flexDirection: 'row',
        gap: Spacing[2],
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.parentLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    pillBlue: {
        backgroundColor: Colors.primarySubtle,
    },
    pillText: {
        fontSize: FontSize.xs,
        color: Colors.parent,
        fontWeight: FontWeight.semiBold,
    },

    // ── Body ─────────────────────────────────────────────────────────────────
    body: {
        paddingHorizontal: Layout.screenPaddingH,
        gap: Spacing[4],
    },

    // ── Section card ─────────────────────────────────────────────────────────
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
            android: { elevation: 2 },
        }),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[2],
    },
    sectionTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.8,
    },
    sectionBody: {
        paddingBottom: Spacing[1],
    },

    // ── Profile row ───────────────────────────────────────────────────────────
    rowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        minHeight: 60,
    },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    iconBubble: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[3],
        flexShrink: 0,
    },
    rowContent: {
        flex: 1,
        gap: 2,
    },
    rowLabel: {
        fontSize: FontSize.base,
        color: Colors.textPrimary,
    },
    rowValue: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    chevron: {
        marginLeft: Spacing[2],
    },

    // ── Children ──────────────────────────────────────────────────────────────
    childRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        gap: Spacing[3],
    },
    childInfo: {
        flex: 1,
        gap: 2,
    },
    relationText: {
        color: Colors.parent,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    childBadges: {
        gap: Spacing[1],
        alignItems: 'flex-end',
    },
    primaryBadge: {
        backgroundColor: Colors.parentLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
    },
    primaryBadgeText: {
        fontSize: FontSize.xs,
        color: Colors.parent,
        fontWeight: FontWeight.semiBold,
    },
    activeBadge: {
        backgroundColor: Colors.successLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
    },
    activeBadgeText: {
        fontSize: FontSize.xs,
        color: Colors.success,
        fontWeight: FontWeight.medium,
    },
    inactiveBadge: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
    },
    inactiveBadgeText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        fontWeight: FontWeight.medium,
    },

    // ── Language ──────────────────────────────────────────────────────────────
    langInner: {
        paddingHorizontal: Spacing[4],
        paddingBottom: Spacing[4],
    },
    langChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
    },

    // ── Always-on badge ───────────────────────────────────────────────────────
    alwaysOnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.successLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[2],
        paddingVertical: 3,
    },
    alwaysOnText: {
        fontSize: FontSize.xs,
        color: Colors.success,
        fontWeight: FontWeight.semiBold,
    },

    // ── Sign out ──────────────────────────────────────────────────────────────
    signOutBtn: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
            android: { elevation: 2 },
        }),
    },
    signOutInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[4],
    },
    signOutIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[3],
    },
    signOutLabel: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.semiBold,
        color: '#ef4444',
    },
});