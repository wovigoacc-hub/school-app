import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import duration from 'dayjs/plugin/duration';
import weekday from 'dayjs/plugin/weekday';
import 'dayjs/locale/ta';    // Tamil
import 'dayjs/locale/ml';    // Malayalam

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(weekday);

// ─── App locale → dayjs locale map ───────────────────────────────────────────

const LOCALE_MAP: Record<string, string> = {
    ENGLISH: 'en',
    TAMIL: 'ta',
    MALAYALAM: 'ml',
};

let currentLocale = 'en';

export function setDateLocale(appLocale: string): void {
    currentLocale = LOCALE_MAP[appLocale] ?? 'en';
    dayjs.locale(currentLocale);
}

// ─── Display formats ──────────────────────────────────────────────────────────

/**
 * "14 Apr 2025" — used in cards, lists, attendance rows
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return dayjs(date).format('D MMM YYYY');
}

/**
 * "14 Apr" — shorter form for compact spaces
 */
export function formatDateShort(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return dayjs(date).format('D MMM');
}

/**
 * "Monday, 14 April 2025" — full form for attendance session header
 */
export function formatDateFull(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return dayjs(date).format('dddd, D MMMM YYYY');
}

/**
 * "2025-04-14" — ISO date-only string for API requests
 */
export function toISODate(date: Date | dayjs.Dayjs): string {
    return dayjs(date).format('YYYY-MM-DD');
}

/**
 * "14 Apr 2025, 3:45 PM" — datetime for audit / message timestamps
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return dayjs(date).format('D MMM YYYY, h:mm A');
}

/**
 * "3:45 PM" — time only
 */
export function formatTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return dayjs(date).format('h:mm A');
}

/**
 * "Apr 2025" — for billing period display
 */
export function formatMonthYear(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return dayjs(date).format('MMM YYYY');
}

// ─── Relative time ────────────────────────────────────────────────────────────

/**
 * "2 hours ago" / "in 3 days" — for notification and message timestamps
 * Falls back to formatted date if older than 7 days
 */
export function formatRelative(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = dayjs(date);
    const now = dayjs();
    const diff = Math.abs(now.diff(d, 'day'));

    if (diff > 7) return formatDate(date);
    return d.fromNow();
}

/**
 * "Just now" / "5m" / "2h" / "3d" — ultra-compact for notification badge
 */
export function formatTimeAgo(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = dayjs(date);
    const now = dayjs();
    const mins = now.diff(d, 'minute');
    const hrs = now.diff(d, 'hour');
    const days = now.diff(d, 'day');

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 7) return `${days}d`;
    return formatDateShort(date);
}

// ─── Due date helpers ─────────────────────────────────────────────────────────

/**
 * true if the date is today
 */
export function isToday(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * true if the date is tomorrow
 */
export function isTomorrow(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
}

/**
 * true if the date has passed (strictly before today)
 */
export function isOverdue(date: string | Date): boolean {
    return dayjs(date).isBefore(dayjs(), 'day');
}

/**
 * true if the date is today or in the past
 */
export function isDueOrOverdue(date: string | Date): boolean {
    return dayjs(date).isSameOrBefore(dayjs(), 'day');
}

/**
 * "Due today" / "Due tomorrow" / "Due in 3 days" / "Overdue by 2 days"
 * Used in homework cards
 */
export function formatDueLabel(dueDate: string | Date): string {
    const d = dayjs(dueDate);
    const now = dayjs();
    const diff = d.diff(now, 'day');

    if (isToday(dueDate)) return 'Due today';
    if (isTomorrow(dueDate)) return 'Due tomorrow';
    if (diff > 0 && diff < 7) return `Due in ${diff} day${diff > 1 ? 's' : ''}`;
    if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`;
    return `Due ${formatDateShort(dueDate)}`;
}

/**
 * "3 days left" / "Closes today" / "Closed" — for exam mark entry
 */
export function formatDeadlineLabel(endDate: string | Date): string {
    const d = dayjs(endDate);
    const now = dayjs();
    const hrs = d.diff(now, 'hour');
    const days = d.diff(now, 'day');

    if (hrs < 0) return 'Closed';
    if (hrs < 24) return `${hrs}h remaining`;
    if (days === 1) return '1 day left';
    return `${days} days left`;
}

// ─── Date range helpers ───────────────────────────────────────────────────────

/**
 * "1 Apr – 30 Apr 2025" — for billing periods
 */
export function formatDateRange(from: string | Date, to: string | Date): string {
    const f = dayjs(from);
    const t = dayjs(to);

    if (f.year() === t.year() && f.month() === t.month()) {
        return `${f.format('D')} – ${t.format('D MMM YYYY')}`;
    }
    if (f.year() === t.year()) {
        return `${f.format('D MMM')} – ${t.format('D MMM YYYY')}`;
    }
    return `${f.format('D MMM YYYY')} – ${t.format('D MMM YYYY')}`;
}

/**
 * Number of calendar days between two dates (inclusive)
 */
export function daysBetween(from: string | Date, to: string | Date): number {
    return dayjs(to).diff(dayjs(from), 'day') + 1;
}

// ─── Attendance-specific ──────────────────────────────────────────────────────

/**
 * Get today's date as "YYYY-MM-DD" — the format attendance submit expects
 */
export function todayISODate(): string {
    return dayjs().format('YYYY-MM-DD');
}

/**
 * Get the days in a given month for attendance calendar
 * Returns array of "YYYY-MM-DD" strings
 */
export function getDaysInMonth(year: number, month: number): string[] {
    const start = dayjs().year(year).month(month - 1).startOf('month');
    const end = start.endOf('month');
    const days: string[] = [];

    let current = start;
    while (current.isSameOrBefore(end, 'day')) {
        days.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
    }
    return days;
}

/**
 * true if the given date is a weekend (Saturday / Sunday)
 */
export function isWeekend(date: string | Date): boolean {
    const day = dayjs(date).day();
    return day === 0 || day === 6;
}

// ─── Tamil / Malayalam calendar month names ───────────────────────────────────
// Used when preferredLang is TAMIL or MALAYALAM for month headers

export const TAMIL_MONTHS = [
    'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்',
    'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்',
    'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்',
];

export const MALAYALAM_MONTHS = [
    'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ',
    'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗസ്റ്റ്',
    'സെപ്തംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ',
];

export function getLocalizedMonthName(
    month: number,    // 1-indexed
    locale: string,
): string {
    const index = month - 1;
    if (locale === 'TAMIL') return TAMIL_MONTHS[index] ?? '';
    if (locale === 'MALAYALAM') return MALAYALAM_MONTHS[index] ?? '';
    return dayjs().month(index).format('MMMM');
}

// ─── Academic year helpers ────────────────────────────────────────────────────

/**
 * "2025-26" — short academic year label
 */
export function formatAcademicYear(startDate: string, endDate: string): string {
    const startYear = dayjs(startDate).year();
    const endYear = dayjs(endDate).year();
    if (startYear === endYear) return String(startYear);
    return `${startYear}-${String(endYear).slice(2)}`;
}

// ─── Export dayjs instance for use elsewhere ──────────────────────────────────
export { dayjs };