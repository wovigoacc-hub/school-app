import React, { useState } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    type ListRenderItem,
} from 'react-native';
import { AppText } from '../common/AppText';
import { AppChip } from '../common/AppChip';
import { AppRefreshControl, useRefresh } from '../common/AppRefreshControl';
import { PresetEmptyState } from '../common/AppEmptyState';
import { SkeletonCard } from '../common/AppSkeleton';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { DIARY_EVENT_TYPE_CONFIG, type DiaryEvent, type DiaryEventType } from '../../types/diary.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function fmtRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return s.toDateString() === e.toDateString()
        ? fmtDate(start)
        : `${fmtDate(start)} – ${fmtDate(end)}`;
}

function groupByMonth(events: DiaryEvent[]): { month: string; data: DiaryEvent[] }[] {
    const map = new Map<string, DiaryEvent[]>();
    const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (const ev of sorted) {
        const key = new Date(ev.startDate).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
        });
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(ev);
    }
    return Array.from(map.entries()).map(([month, data]) => ({ month, data }));
}

// ─── Filter chips config ──────────────────────────────────────────────────────

const TYPE_CHIPS: { value: DiaryEventType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'HOLIDAY', label: 'Holiday' },
    { value: 'HALF_DAY', label: 'Half Day' },
    { value: 'EXAM', label: 'Exam' },
    { value: 'EVENT', label: 'Event' },
    { value: 'PARENT_MEETING', label: 'Meeting' },
    { value: 'SCHOOL_CLOSURE', label: 'Closure' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'CULTURAL', label: 'Cultural' },
    { value: 'FIELD_TRIP', label: 'Trip' },
];

// ─── Single event row ─────────────────────────────────────────────────────────

function EventRow({ event }: { event: DiaryEvent }) {
    const cfg = DIARY_EVENT_TYPE_CONFIG[event.type] ?? DIARY_EVENT_TYPE_CONFIG.OTHER;
    const dot = event.color ?? cfg.color;

    return (
        <View style={styles.eventRow}>
            {/* Left colour dot + vertical line */}
            <View style={styles.dotColumn}>
                <View style={[styles.dot, { backgroundColor: dot }]} />
            </View>

            {/* Content */}
            <View style={styles.eventContent}>
                <AppText variant="body1" style={styles.eventTitle} numberOfLines={2}>
                    {event.title}
                </AppText>

                <View style={styles.eventMeta}>
                    {/* Type chip */}
                    <View style={[styles.typeChip, { backgroundColor: cfg.bg }]}>
                        <AppText style={[styles.typeChipText, { color: cfg.color }]}>
                            {cfg.label}
                        </AppText>
                    </View>

                    {/* Date */}
                    <AppText variant="caption" secondary style={styles.dateText}>
                        {fmtRange(event.startDate, event.endDate)}
                        {!event.isFullDay && event.startTime
                            ? ` · ${event.startTime}` : ''}
                    </AppText>
                </View>

                {/* No-attendance badge */}
                {event.affectsAttendance && (
                    <View style={styles.attendanceBadge}>
                        <AppText style={styles.attendanceBadgeText}>No attendance</AppText>
                    </View>
                )}

                {/* Scope */}
                {!event.isSchoolWide && event.targetClasses.length > 0 && (
                    <AppText variant="caption" secondary numberOfLines={1} style={{ marginTop: 2 }}>
                        {event.targetClasses.map((c) => `${c.name} ${c.section}`).join(', ')}
                    </AppText>
                )}

                {/* Description */}
                {!!event.description && (
                    <AppText variant="caption" secondary numberOfLines={2} style={styles.desc}>
                        {event.description}
                    </AppText>
                )}
            </View>
        </View>
    );
}

// ─── Month section ────────────────────────────────────────────────────────────

type FlatItem =
    | { kind: 'header'; month: string }
    | { kind: 'event'; event: DiaryEvent };

// ─── Main Component ───────────────────────────────────────────────────────────

interface DiaryCalendarViewProps {
    events: DiaryEvent[];
    calendarName?: string;
    isLoading: boolean;
    onRefresh: () => void;
    accentColor?: string;  // parent = purple, teacher = blue
}

export function DiaryCalendarView({
    events,
    calendarName,
    isLoading,
    onRefresh,
    accentColor = Colors.primary,
}: DiaryCalendarViewProps) {
    const [typeFilter, setTypeFilter] = useState<DiaryEventType | 'ALL'>('ALL');
    const { refreshing, onRefresh: handleRefresh } = useRefresh(onRefresh);

    const filtered = typeFilter === 'ALL'
        ? events
        : events.filter((e) => e.type === typeFilter);

    const grouped = groupByMonth(filtered);

    // Flatten groups into a single array for FlatList
    const flatItems: FlatItem[] = [];
    for (const { month, data } of grouped) {
        flatItems.push({ kind: 'header', month });
        for (const event of data) {
            flatItems.push({ kind: 'event', event });
        }
    }

    // Only show chips that have events
    const availableChips = TYPE_CHIPS.filter((chip) => {
        if (chip.value === 'ALL') return true;
        return events.some((e) => e.type === chip.value);
    });

    const renderItem: ListRenderItem<FlatItem> = ({ item }) => {
        if (item.kind === 'header') {
            return (
                <View style={styles.monthHeader}>
                    <AppText style={[styles.monthText, { color: accentColor }]}>
                        {item.month.toUpperCase()}
                    </AppText>
                    <View style={[styles.monthLine, { backgroundColor: accentColor + '22' }]} />
                </View>
            );
        }
        return <EventRow event={item.event} />;
    };

    return (
        <FlatList
            data={isLoading ? [] : flatItems}
            keyExtractor={(item, idx) =>
                item.kind === 'header' ? `h-${item.month}` : `e-${item.event.id}-${idx}`
            }
            renderItem={renderItem}
            refreshControl={
                <AppRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListHeaderComponent={
                <View style={styles.header}>
                    {/* Calendar name */}
                    {calendarName && (
                        <View style={styles.calendarNameRow}>
                            <View style={[styles.calendarDot, { backgroundColor: accentColor }]} />
                            <AppText variant="caption" secondary>{calendarName}</AppText>
                        </View>
                    )}

                    {/* Filter chips */}
                    <FlatList
                        horizontal
                        data={availableChips}
                        keyExtractor={(c) => c.value}
                        renderItem={({ item: chip }) => (
                            <AppChip
                                label={chip.label}
                                selected={typeFilter === chip.value}
                                onPress={() => setTypeFilter(chip.value)}
                                size="sm"
                                style={styles.chip}
                            />
                        )}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsRow}
                    />
                </View>
            }
            ListEmptyComponent={
                isLoading ? (
                    <View style={styles.skeletons}>
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonCard key={i} lines={2} style={styles.skeletonCard} />
                        ))}
                    </View>
                ) : (
                    <PresetEmptyState
                        preset="announcements"
                        title={typeFilter === 'ALL' ? 'No events yet' : `No ${typeFilter.toLowerCase().replace('_', ' ')} events`}
                        message="Your school calendar events will appear here."
                        compact
                    />
                )
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: Spacing[10],
    },
    header: {
        paddingTop: Spacing[3],
        gap: Spacing[2],
    },
    calendarNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
        paddingHorizontal: Layout.screenPaddingH,
    },
    calendarDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chipsRow: {
        paddingHorizontal: Layout.screenPaddingH,
        gap: Spacing[2],
        paddingBottom: Spacing[1],
    },
    chip: {
        marginRight: 0,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
        paddingHorizontal: Layout.screenPaddingH,
        paddingTop: Spacing[5],
        paddingBottom: Spacing[2],
    },
    monthText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold as any,
        letterSpacing: 1.2,
    },
    monthLine: {
        flex: 1,
        height: 1,
    },
    // ── Event row ──────────────────────────────────────────────────────────────
    eventRow: {
        flexDirection: 'row',
        paddingHorizontal: Layout.screenPaddingH,
        paddingVertical: Spacing[3],
        backgroundColor: Colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    dotColumn: {
        width: 24,
        alignItems: 'center',
        paddingTop: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    eventContent: {
        flex: 1,
        gap: Spacing[1],
    },
    eventTitle: {
        fontWeight: FontWeight.semiBold as any,
        color: Colors.textPrimary,
    },
    eventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
        flexWrap: 'wrap',
    },
    typeChip: {
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    typeChipText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semiBold as any,
    },
    dateText: {
        fontSize: FontSize.xs,
    },
    attendanceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#fffbeb',
        paddingHorizontal: Spacing[2],
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    attendanceBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium as any,
        color: '#b45309',
    },
    desc: {
        marginTop: 2,
    },
    skeletons: {
        paddingHorizontal: Layout.screenPaddingH,
        gap: Spacing[3],
        paddingTop: Spacing[4],
    },
    skeletonCard: {},
});
