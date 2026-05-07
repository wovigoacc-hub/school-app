import React, { useCallback, useState } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Spacer } from '../../../components/layout/Divider';
import { AppText } from '../../../components/common/AppText';
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
            <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={18} color={iconColor} />
            </View>
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

    const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
    const classTeacherCount = classes.filter(c => c.isClassTeacher).length;

    return (
        <ScreenWrapper statusBar="teacher" noKeyboard noPadding>
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

                    {/* Role pill */}
                    <View style={styles.pillRow}>
                        <View style={styles.pill}>
                            <Icon name="school" size={12} color={Colors.primary} />
                            <AppText style={styles.pillText}>Teacher</AppText>
                        </View>
                        {classTeacherCount > 0 && (
                            <View style={[styles.pill, styles.pillGold]}>
                                <Icon name="star" size={12} color="#f59e0b" />
                                <AppText style={[styles.pillText, { color: '#f59e0b' }]}>
                                    Class Teacher
                                </AppText>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Stats bar ─────────────────────────────────────────────── */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconBubble, { backgroundColor: '#eff6ff' }]}>
                            <Icon name="layers" size={18} color={Colors.primary} />
                        </View>
                        <AppText style={[styles.statNumber, { color: Colors.primary }]}>
                            {classes.length}
                        </AppText>
                        <AppText variant="caption" secondary>Classes</AppText>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconBubble, { backgroundColor: '#f0fdf4' }]}>
                            <Icon name="people" size={18} color={Colors.success} />
                        </View>
                        <AppText style={[styles.statNumber, { color: Colors.success }]}>
                            {totalStudents}
                        </AppText>
                        <AppText variant="caption" secondary>Students</AppText>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconBubble, { backgroundColor: '#fffbeb' }]}>
                            <Icon name="ribbon" size={18} color="#f59e0b" />
                        </View>
                        <AppText style={[styles.statNumber, { color: '#f59e0b' }]}>
                            {classTeacherCount}
                        </AppText>
                        <AppText variant="caption" secondary>Class Role</AppText>
                    </View>
                </View>

                <View style={styles.body}>

                    {/* ── My Classes ───────────────────────────────────────────── */}
                    {classes.length > 0 && (
                        <SectionCard title="My Classes" icon="school-outline" iconColor="#3b82f6">
                            {classes.map((cls, i) => (
                                <View
                                    key={cls.classId}
                                    style={[styles.classRow, i < classes.length - 1 && styles.rowBorder]}
                                >
                                    <View style={styles.classBadge}>
                                        <AppText style={styles.classBadgeText}>
                                            {cls.name.charAt(0)}{cls.section}
                                        </AppText>
                                    </View>
                                    <View style={styles.classInfo}>
                                        <View style={styles.classNameRow}>
                                            <AppText variant="subtitle2">
                                                {cls.name} – {cls.section}
                                            </AppText>
                                            {cls.isClassTeacher && (
                                                <View style={styles.ctBadge}>
                                                    <Icon name="star" size={10} color="#f59e0b" />
                                                    <AppText style={styles.ctBadgeText}>CT</AppText>
                                                </View>
                                            )}
                                        </View>
                                        <AppText variant="caption" secondary>
                                            {cls.studentCount} students
                                        </AppText>
                                        {cls.mySubjects.length > 0 && (
                                            <AppText variant="caption" style={styles.subjectText} numberOfLines={1}>
                                                {cls.mySubjects.map((s) => s.subjectName).join(' · ')}
                                            </AppText>
                                        )}
                                    </View>
                                    <Icon name="chevron-forward" size={16} color={Colors.textTertiary} />
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

                    {/* ── Account ──────────────────────────────────────────────── */}
                    <SectionCard title="Account" icon="person-circle" iconColor="#3b82f6">
                        <ProfileRow
                            icon="notifications"
                            iconColor="#f59e0b"
                            iconBg="#fffbeb"
                            label="Notifications"
                            value="All enabled"
                            onPress={() => navigation.navigate('NotificationInbox')}
                        />
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
        paddingBottom: Spacing[4],
        paddingTop: Spacing[2],
    },
    heroBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 130,
        backgroundColor: Colors.primarySubtle,
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
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
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
        backgroundColor: Colors.primary,
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
        backgroundColor: Colors.primarySubtle,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[1],
    },
    pillGold: {
        backgroundColor: '#fffbeb',
    },
    pillText: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        fontWeight: FontWeight.semiBold,
    },

    // ── Stats card ─────────────────────────────────────────────────────────────
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: Layout.screenPaddingH,
        marginTop: Spacing[4],
        marginBottom: Spacing[5],
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingVertical: Spacing[4],
        paddingHorizontal: Spacing[2],
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: { elevation: 3 },
        }),
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statIconBubble: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    statNumber: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        lineHeight: 24,
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        height: 60,
        backgroundColor: Colors.border,
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

    // ── Profile row ──────────────────────────────────────────────────────────
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

    // ── Class rows ───────────────────────────────────────────────────────────
    classRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        gap: Spacing[3],
    },
    classBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
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
    classInfo: {
        flex: 1,
        gap: 2,
    },
    classNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    ctBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#fffbeb',
        borderRadius: BorderRadius.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    ctBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#f59e0b',
    },
    subjectText: {
        color: Colors.primary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },

    // ── Language ─────────────────────────────────────────────────────────────
    langInner: {
        paddingHorizontal: Spacing[4],
        paddingBottom: Spacing[4],
    },
    langChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing[2],
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