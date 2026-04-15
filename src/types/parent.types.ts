import { Language } from './auth.types';
import { NotificationPreferences } from './user.types';

// ─── Parent profile ───────────────────────────────────────────────────────────

export interface Parent {
    id: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photoUrl?: string;
    preferredLang: Language;
    isActive: boolean;
    isFirstLogin: boolean;
    lastLoginAt?: string;
    createdAt: string;
    notificationPrefs: NotificationPreferences;
    children: LinkedChild[];
}

// ─── Linked child (parent's view of their student) ───────────────────────────

export interface LinkedChild {
    studentId: string;
    firstName: string;
    lastName: string;
    rollNumber?: string;
    photoUrl?: string;
    classId: string;
    className: string;
    section: string;
    isActive: boolean;
    isPrimary: boolean;
    relation?: string;
}

// ─── Parent self-update ───────────────────────────────────────────────────────

export interface UpdateParentSelfRequest {
    photoUrl?: string;
    phone?: string;
    preferredLang?: Language;
}