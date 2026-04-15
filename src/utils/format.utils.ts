import { Grade, GRADE_COLOURS } from '../types/mark.types';

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * ₹2,999 — Indian locale, no decimals for whole numbers
 */
export function formatCurrency(amountInRupees: number): string {
    return `₹${amountInRupees.toLocaleString('en-IN')}`;
}

/**
 * ₹2,999.50 — with decimal places
 */
export function formatCurrencyDecimal(amountInRupees: number): string {
    return `₹${amountInRupees.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * Paise → rupees display: 299900 → "₹2,999"
 */
export function formatPaise(amountInPaise: number): string {
    return formatCurrency(amountInPaise / 100);
}

// ─── Percentage ───────────────────────────────────────────────────────────────

/**
 * 87.5 → "87.5%" — one decimal place, null-safe
 */
export function formatPercentage(
    value: number | null | undefined,
    decimals = 1,
): string {
    if (value === null || value === undefined) return '—';
    return `${Number(value).toFixed(decimals)}%`;
}

/**
 * 87 → "87%" — no decimals (for attendance display)
 */
export function formatAttendancePct(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${Math.round(value)}%`;
}

// ─── Marks ────────────────────────────────────────────────────────────────────

/**
 * "87.5 / 100" — marks obtained over max
 */
export function formatMarks(
    obtained: number | null | undefined,
    max: number,
): string {
    if (obtained === null || obtained === undefined) return `— / ${max}`;
    return `${obtained} / ${max}`;
}

/**
 * Grade badge label — returns the grade or "—" for absent/unset
 */
export function formatGrade(grade: string | null | undefined): string {
    if (!grade) return '—';
    return grade;
}

/**
 * Grade → text colour (for coloured badges)
 */
export function gradeColour(grade: string | null | undefined): string {
    if (!grade) return '#9ca3af';
    return GRADE_COLOURS[grade] ?? '#9ca3af';
}

/**
 * Percentage → grade string (mirrors backend logic)
 */
export function percentageToGrade(pct: number | null): Grade | '—' {
    if (pct === null) return '—';
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 35) return 'D';
    return 'F';
}

// ─── Rank ─────────────────────────────────────────────────────────────────────

/**
 * 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th"
 */
export function formatRank(rank: number | null | undefined): string {
    if (rank === null || rank === undefined) return '—';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return `${rank}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// ─── Names ────────────────────────────────────────────────────────────────────

/**
 * "Priya Ramachandran" → "Priya R." — for compact lists
 */
export function formatNameCompact(firstName: string, lastName: string): string {
    if (!lastName) return firstName;
    return `${firstName} ${lastName.charAt(0)}.`;
}

/**
 * "Priya Ramachandran" — full name
 */
export function formatFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
}

/**
 * "PR" — initials for avatar placeholder
 */
export function getInitials(firstName: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() ?? '';
    const last = lastName?.charAt(0)?.toUpperCase() ?? '';
    return `${first}${last}` || '?';
}

// ─── File size ────────────────────────────────────────────────────────────────

/**
 * 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

// ─── Text ─────────────────────────────────────────────────────────────────────

/**
 * Truncate text to n characters with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Capitalise first letter of each word
 */
export function titleCase(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * "UNDER_REVIEW" → "Under Review"
 */
export function formatEnumLabel(enumValue: string): string {
    return titleCase(enumValue.replace(/_/g, ' '));
}

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * "+91 98765 43210" → formats Indian mobile numbers
 */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');

    // Indian mobile: 10 digits
    if (digits.length === 10) {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    // With country code
    if (digits.length === 12 && digits.startsWith('91')) {
        return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }
    return phone;
}

// ─── Roll number ─────────────────────────────────────────────────────────────

/**
 * Roll number with leading zeros: "5" → "05" (for consistent sorting display)
 */
export function formatRollNumber(roll: string | null | undefined): string {
    if (!roll) return '—';
    const num = parseInt(roll, 10);
    if (isNaN(num)) return roll;
    return String(num).padStart(2, '0');
}

// ─── Submission rate ──────────────────────────────────────────────────────────

/**
 * 3 submitted out of 40 → "3/40 (7%)"
 */
export function formatSubmissionRate(
    submitted: number,
    total: number,
): string {
    if (total === 0) return '0/0';
    const pct = Math.round((submitted / total) * 100);
    return `${submitted}/${total} (${pct}%)`;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

/**
 * 3.2 GB used out of 5 GB → "3.2 / 5 GB (64%)"
 */
export function formatStorageUsage(usedGb: number, maxGb: number): string {
    const pct = Math.round((usedGb / maxGb) * 100);
    return `${usedGb.toFixed(1)} / ${maxGb} GB (${pct}%)`;
}