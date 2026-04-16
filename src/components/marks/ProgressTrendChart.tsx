import React, { useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import Svg, {
    Path,
    Circle,
    Line,
    Text as SvgText,
    Defs,
    LinearGradient,
    Stop,
    Rect,
} from 'react-native-svg';
import { AppText } from '../common/AppText';
import { GradeBadge, MarksDisplay } from './GradeBadge';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { gradeColour, percentageToGrade } from '../../utils/format.utils';
import type { SubjectProgressTrend, TrendDataPoint } from '../../types/mark.types';

// ─── Chart dimensions ─────────────────────────────────────────────────────────

const CHART_HEIGHT = 160;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;   // space for x-axis labels
const PADDING_LEFT = 36;   // space for y-axis labels
const PADDING_RIGHT = 16;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const MIN_POINT_GAP = 72;   // minimum pixels between data points

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getYPosition(pct: number): number {
    // 0% = bottom, 100% = top
    return PADDING_TOP + PLOT_HEIGHT * (1 - pct / 100);
}

function buildLinePath(points: Array<{ x: number; y: number }>): string {
    if (points.length === 0) return '';
    const [first, ...rest] = points;
    const segments = rest.map((p, i) => {
        const prev = points[i];
        const cpx1 = prev.x + (p.x - prev.x) / 3;
        const cpx2 = p.x - (p.x - prev.x) / 3;
        return `C ${cpx1},${prev.y} ${cpx2},${p.y} ${p.x},${p.y}`;
    });
    return `M ${first.x},${first.y} ${segments.join(' ')}`;
}

// ─── Single subject trend chart ───────────────────────────────────────────────

interface TrendChartProps {
    data: TrendDataPoint[];
    subjectName: string;
    passMark: number;
    lineColour?: string;
    width?: number;
    style?: StyleProp<ViewStyle>;
}

export function TrendChart({
    data,
    subjectName,
    passMark,
    lineColour = Colors.primary,
    width,
    style,
}: TrendChartProps) {
    const validData = data.filter((d) => d.percentage != null && !d.isAbsent);

    const chartWidth = useMemo(
        () => width ?? Math.max(validData.length * MIN_POINT_GAP + PADDING_LEFT + PADDING_RIGHT, 280),
        [validData.length, width],
    );

    const points = useMemo(() => {
        if (validData.length === 0) return [];
        const step = (chartWidth - PADDING_LEFT - PADDING_RIGHT) / Math.max(validData.length - 1, 1);
        return validData.map((d, i) => ({
            x: PADDING_LEFT + i * step,
            y: getYPosition(d.percentage ?? 0),
            data: d,
        }));
    }, [validData, chartWidth]);

    const linePath = buildLinePath(points);
    const passY = getYPosition(passMark);
    const gradientId = `grad-${subjectName.replace(/\s/g, '')}`;

    if (validData.length === 0) {
        return (
            <View style={[styles.emptyChart, { width: chartWidth }, style]}>
                <AppText variant="caption" tertiary center>No data yet</AppText>
            </View>
        );
    }

    return (
        <View style={[{ width: chartWidth }, style]}>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={lineColour} stopOpacity="0.25" />
                        <Stop offset="1" stopColor={lineColour} stopOpacity="0" />
                    </LinearGradient>
                </Defs>

                {/* Y-axis gridlines at 0%, 25%, 50%, 75%, 100% */}
                {[0, 25, 50, 75, 100].map((pct) => {
                    const y = getYPosition(pct);
                    return (
                        <React.Fragment key={pct}>
                            <Line
                                x1={PADDING_LEFT}
                                y1={y}
                                x2={chartWidth - PADDING_RIGHT}
                                y2={y}
                                stroke={Colors.border}
                                strokeWidth={0.5}
                                strokeDasharray="4,4"
                            />
                            <SvgText
                                x={PADDING_LEFT - 4}
                                y={y + 4}
                                fontSize={9}
                                fill={Colors.textTertiary}
                                textAnchor="end"
                            >
                                {pct}
                            </SvgText>
                        </React.Fragment>
                    );
                })}

                {/* Pass mark line */}
                <Line
                    x1={PADDING_LEFT}
                    y1={passY}
                    x2={chartWidth - PADDING_RIGHT}
                    y2={passY}
                    stroke={Colors.warning}
                    strokeWidth={1.5}
                    strokeDasharray="6,4"
                />
                <SvgText
                    x={chartWidth - PADDING_RIGHT + 2}
                    y={passY + 4}
                    fontSize={9}
                    fill={Colors.warning}
                >
                    Pass
                </SvgText>

                {/* Filled area under curve */}
                {points.length > 1 && (
                    <Path
                        d={`${linePath} L ${points[points.length - 1].x},${CHART_HEIGHT - PADDING_BOTTOM} L ${points[0].x},${CHART_HEIGHT - PADDING_BOTTOM} Z`}
                        fill={`url(#${gradientId})`}
                    />
                )}

                {/* Line */}
                {points.length > 1 && (
                    <Path
                        d={linePath}
                        stroke={lineColour}
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                )}

                {/* Data points */}
                {points.map((p, i) => {
                    const pct = p.data.percentage ?? 0;
                    const colour = gradeColour(p.data.grade);
                    return (
                        <React.Fragment key={i}>
                            {/* Outer ring */}
                            <Circle
                                cx={p.x}
                                cy={p.y}
                                r={8}
                                fill="white"
                                stroke={colour}
                                strokeWidth={2}
                            />
                            {/* Inner dot */}
                            <Circle cx={p.x} cy={p.y} r={4} fill={colour} />
                        </React.Fragment>
                    );
                })}

                {/* X-axis labels */}
                {points.map((p, i) => (
                    <SvgText
                        key={i}
                        x={p.x}
                        y={CHART_HEIGHT - PADDING_BOTTOM + 14}
                        fontSize={9}
                        fill={Colors.textTertiary}
                        textAnchor="middle"
                    >
                        {p.data.examType?.replace('_', ' ').slice(0, 8)}
                    </SvgText>
                ))}
            </Svg>
        </View>
    );
}

// ─── Subject progress card (chart + latest grade summary) ────────────────────

interface SubjectProgressCardProps {
    trend: SubjectProgressTrend;
    style?: StyleProp<ViewStyle>;
}

export function SubjectProgressCard({ trend, style }: SubjectProgressCardProps) {
    const latest = trend.trend[trend.trend.length - 1];
    const lineColour = latest?.grade ? gradeColour(latest.grade) : Colors.primary;

    return (
        <View style={[styles.card, style]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <AppText variant="subtitle1" numberOfLines={1} style={styles.cardTitle}>
                    {trend.subjectName}
                </AppText>
                {latest && (
                    <View style={styles.latestSummary}>
                        {latest.grade && (
                            <GradeBadge
                                grade={latest.grade}
                                percentage={latest.percentage}
                                size="sm"
                            />
                        )}
                        {latest.classRank && (
                            <AppText variant="caption" tertiary>
                                Rank {latest.classRank}
                            </AppText>
                        )}
                    </View>
                )}
            </View>

            {/* Scrollable chart */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScroll}
                nestedScrollEnabled
            >
                <TrendChart
                    data={trend.trend}
                    subjectName={trend.subjectName}
                    passMark={35}   // TODO: receive from subject config
                    lineColour={lineColour}
                />
            </ScrollView>

            {/* Class average comparison */}
            {latest?.classAverage != null && latest.percentage != null && (
                <View style={styles.comparisonRow}>
                    <AppText variant="caption" secondary>
                        You: {latest.percentage.toFixed(1)}%
                    </AppText>
                    <AppText variant="caption" tertiary>·</AppText>
                    <AppText variant="caption" secondary>
                        Class avg: {latest.classAverage.toFixed(1)}%
                    </AppText>
                    <AppText
                        variant="caption"
                        style={{
                            color: latest.percentage >= latest.classAverage
                                ? Colors.success
                                : Colors.error,
                            fontWeight: FontWeight.semiBold,
                        }}
                    >
                        {latest.percentage >= latest.classAverage ? '↑' : '↓'}
                        {Math.abs(latest.percentage - latest.classAverage).toFixed(1)}%
                    </AppText>
                </View>
            )}
        </View>
    );
}

// ─── All subjects trend list ──────────────────────────────────────────────────

interface ProgressTrendChartProps {
    trends: SubjectProgressTrend[];
    style?: StyleProp<ViewStyle>;
}

export function ProgressTrendChart({ trends, style }: ProgressTrendChartProps) {
    if (!trends.length) {
        return (
            <View style={[styles.empty, style]}>
                <AppText variant="body1" secondary center>
                    No results data available yet
                </AppText>
            </View>
        );
    }

    return (
        <View style={[styles.list, style]}>
            {trends.map((trend) => (
                <SubjectProgressCard
                    key={trend.subjectId}
                    trend={trend}
                    style={styles.cardSpacing}
                />
            ))}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    emptyChart: {
        height: CHART_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[2],
    },
    cardTitle: {
        flex: 1,
        marginRight: Spacing[2],
    },
    latestSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
    },
    chartScroll: {
        paddingHorizontal: Spacing[2],
        paddingBottom: Spacing[2],
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
        paddingHorizontal: Spacing[4],
        paddingBottom: Spacing[3],
    },
    list: {
        gap: Spacing[4],
    },
    cardSpacing: {
        // gap handled by list
    },
    empty: {
        paddingVertical: Spacing[8],
        alignItems: 'center',
    },
});