// ─── All validators return string (error message) | true (pass) ──────────────
// Compatible with react-hook-form's validate field

// ─── Required ─────────────────────────────────────────────────────────────────

export function required(value: unknown): string | true {
    if (value === null || value === undefined) return 'This field is required';
    if (typeof value === 'string' && !value.trim()) return 'This field is required';
    if (Array.isArray(value) && value.length === 0) return 'Select at least one option';
    return true;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export function validEmail(value: string): string | true {
    if (!value) return true; // let required() handle empty
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim()) || 'Enter a valid email address';
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function minPasswordLength(value: string): string | true {
    if (!value) return true;
    return value.length >= 8 || 'Password must be at least 8 characters';
}

export function strongPassword(value: string): string | true {
    if (!value) return true;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    if (!hasUpper || !hasLower || !hasNumber) {
        return 'Password must include uppercase, lowercase, and a number';
    }
    return true;
}

export function passwordsMatch(
    password: string,
): (confirmValue: string) => string | true {
    return (confirmValue: string) =>
        confirmValue === password || 'Passwords do not match';
}

// ─── Name ─────────────────────────────────────────────────────────────────────

export function validName(value: string): string | true {
    if (!value) return true;
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 100) return 'Name must be under 100 characters';
    return true;
}

// ─── Phone ────────────────────────────────────────────────────────────────────

export function validIndianPhone(value: string): string | true {
    if (!value) return true;
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return true;
    if (digits.length === 12 && digits.startsWith('91')) return true;
    return 'Enter a valid 10-digit mobile number';
}

// ─── Marks ────────────────────────────────────────────────────────────────────

export function validMark(maxMarks: number) {
    return (value: string): string | true => {
        if (!value && value !== '0') return true; // optional field — absent handled separately
        const num = parseFloat(value);
        if (isNaN(num)) return 'Enter a valid number';
        if (num < 0) return 'Marks cannot be negative';
        if (num > maxMarks) return `Cannot exceed maximum marks (${maxMarks})`;
        return true;
    };
}

export function marksOrAbsent(maxMarks: number) {
    return (value: string, formValues: Record<string, any>): string | true => {
        const isAbsent = formValues?.isAbsent === true;
        if (isAbsent) return true; // absent — no mark needed
        return validMark(maxMarks)(value);
    };
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function validDate(value: string): string | true {
    if (!value) return true;
    const d = new Date(value);
    return !isNaN(d.getTime()) || 'Enter a valid date';
}

export function dateNotInPast(value: string): string | true {
    if (!value) return true;
    const d = new Date(value);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d >= now || 'Date cannot be in the past';
}

export function dateNotInFuture(value: string): string | true {
    if (!value) return true;
    const d = new Date(value);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return d <= now || 'Date cannot be in the future';
}

export function endDateAfterStart(startDate: string) {
    return (endDate: string): string | true => {
        if (!endDate || !startDate) return true;
        return (
            new Date(endDate) >= new Date(startDate) ||
            'End date must be on or after start date'
        );
    };
}

// ─── Text length ──────────────────────────────────────────────────────────────

export function maxLength(max: number) {
    return (value: string): string | true => {
        if (!value) return true;
        return value.length <= max || `Must be ${max} characters or fewer`;
    };
}

export function minLength(min: number) {
    return (value: string): string | true => {
        if (!value) return true;
        return value.length >= min || `Must be at least ${min} characters`;
    };
}

// ─── File validation ──────────────────────────────────────────────────────────

export function validFileSize(maxMb: number) {
    return (sizeBytes: number): string | true => {
        const maxBytes = maxMb * 1024 * 1024;
        return sizeBytes <= maxBytes || `File must be under ${maxMb}MB`;
    };
}

export function validMimeType(allowed: string[]) {
    return (mimeType: string): string | true => {
        return (
            allowed.includes(mimeType) ||
            `File type not allowed. Accepted: ${allowed.join(', ')}`
        );
    };
}

// ─── Leave dates ──────────────────────────────────────────────────────────────

export function leaveDatesValid(
    startDate: string,
    endDate: string,
): string | null {
    if (!startDate || !endDate) return 'Both start and end dates are required';
    if (new Date(endDate) < new Date(startDate)) {
        return 'End date must be on or after start date';
    }
    return null; // valid
}

// ─── Compose validators (for react-hook-form validate object) ─────────────────

/**
 * Combine multiple validators into one validate rules object
 * Usage: validate: composeValidators(required, validEmail)
 */
export function composeValidators(
    ...validators: Array<(value: any) => string | true>
): (value: any) => string | true {
    return (value: any) => {
        for (const validator of validators) {
            const result = validator(value);
            if (result !== true) return result;
        }
        return true;
    };
}