import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Share,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { AppText } from '../../../components/common/AppText';
import { AnnouncementTypeBadge } from '../../../components/common/AppBadge';
import { useGetTeacherAnnouncementQuery } from '../../../services/teacher/announcements.service';
import { useGetParentAnnouncementQuery } from '../../../services/parent/announcements.service';
import { useAuth } from '../../../hooks/useAuth';
import { Colors } from '../../../constants/colors';
import { Spacing, Layout, BorderRadius } from '../../../constants/spacing';
import { formatDateFull, formatTime } from '../../../utils/date.utils';

export function AnnouncementDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { announcementId } = route.params;
    const { isTeacher } = useAuth();

    const teacherQuery = useGetTeacherAnnouncementQuery(announcementId, {
        skip: !isTeacher,
    });
    const parentQuery = useGetParentAnnouncementQuery(announcementId, {
        skip: isTeacher,
    });

    const { data, isLoading, error } = isTeacher ? teacherQuery : parentQuery;
    const announcement = data?.data;

    const handleShare = async () => {
        if (!announcement) return;
        try {
            await Share.share({
                title: announcement.title,
                message: `${announcement.title}\n\n${announcement.body}`,
            });
        } catch (err) {
            Alert.alert('Error', 'Failed to share announcement');
        }
    };

    if (isLoading) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={isTeacher ? Colors.teacher : Colors.parent} />
                    <AppText secondary style={styles.loadingText}>Loading announcement...</AppText>
                </View>
            </ScreenWrapper>
        );
    }

    if (error || !announcement) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <Icon name="alert-circle-outline" size={48} color={Colors.error} />
                    <AppText bold style={styles.errorText}>Failed to load announcement</AppText>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <AppText color={Colors.primary}>Go Back</AppText>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const {
        title,
        body,
        type,
        publishedAt,
        authorName,
        targetClasses,
        audience,
    } = announcement;

    const themeColor = isTeacher ? Colors.teacher : Colors.parent;
    const themeLight = isTeacher ? Colors.teacherLight : Colors.parentLight;

    return (
        <ScreenWrapper statusBar={isTeacher ? 'teacher' : 'parent'} noPadding>
            {/* Header / Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.toolbarAction}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-back" size={24} color={Colors.grey900} />
                </TouchableOpacity>
                <AppText variant="subtitle1" bold flex center numberOfLines={1}>
                    Announcement
                </AppText>
                <TouchableOpacity 
                    onPress={handleShare}
                    style={styles.toolbarAction}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="share-outline" size={24} color={Colors.grey900} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Type & Time Badge */}
                <View style={styles.metaHeader}>
                    <AnnouncementTypeBadge type={type} />
                    <View style={styles.dateTime}>
                        <Icon name="time-outline" size={14} color={Colors.textTertiary} />
                        <AppText variant="caption" tertiary style={styles.dateText}>
                            {formatTime(publishedAt)} · {formatDateFull(publishedAt)}
                        </AppText>
                    </View>
                </View>

                {/* Title Section */}
                <AppText variant="h2" bold style={styles.title}>
                    {title}
                </AppText>

                {/* Body Content */}
                <View style={styles.bodyContainer}>
                    <AppText variant="body1" style={styles.bodyText}>
                        {body}
                    </AppText>
                </View>

                {/* Author Card */}
                <View style={styles.authorCard}>
                    <View style={[styles.avatarContainer, { backgroundColor: themeLight }]}>
                        <AppText bold style={[styles.avatarText, { color: themeColor }]}>
                            {authorName.charAt(0).toUpperCase()}
                        </AppText>
                    </View>
                    <View style={styles.authorInfo}>
                        <AppText variant="caption" tertiary style={styles.postedBy}>
                            POSTED BY
                        </AppText>
                        <AppText variant="subtitle2" bold style={styles.authorName}>
                            {authorName}
                        </AppText>
                        <View style={styles.audienceRow}>
                            <Icon name="people-outline" size={12} color={Colors.textSecondary} />
                            <AppText variant="caption" secondary style={styles.audienceText}>
                                {targetClasses && targetClasses.length > 0
                                    ? `Classes: ${targetClasses.join(', ')}`
                                    : audience === 'ALL'
                                        ? 'Everyone'
                                        : audience === 'PARENTS'
                                            ? 'Parents Only'
                                            : 'Teachers Only'}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* Footer disclaimer */}
                <View style={styles.footer}>
                    <View style={styles.divider} />
                    <AppText variant="caption" tertiary center style={styles.disclaimer}>
                        This is an official communication from the school management.
                    </AppText>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    content: {
        padding: Layout.screenPaddingH,
        paddingBottom: Spacing[10],
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Layout.screenPaddingH,
    },
    loadingText: {
        marginTop: Spacing[4],
    },
    errorText: {
        marginTop: Spacing[4],
        color: Colors.error,
    },
    backButton: {
        marginTop: Spacing[6],
        padding: Spacing[3],
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[2],
        height: 56,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    toolbarAction: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing[6],
    },
    dateTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
    },
    title: {
        fontSize: 26,
        lineHeight: 34,
        color: Colors.textPrimary,
        marginBottom: Spacing[6],
    },
    bodyContainer: {
        marginBottom: Spacing[10],
    },
    bodyText: {
        fontSize: 17,
        lineHeight: 28,
        color: Colors.grey800,
    },
    authorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
    },
    authorInfo: {
        flex: 1,
        marginLeft: Spacing[4],
    },
    postedBy: {
        fontSize: 10,
        letterSpacing: 1,
        marginBottom: 2,
    },
    authorName: {
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    audienceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    audienceText: {
        fontSize: 12,
    },
    footer: {
        marginTop: Spacing[10],
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: Spacing[4],
    },
    disclaimer: {
        paddingHorizontal: Spacing[10],
        lineHeight: 18,
    },
});
