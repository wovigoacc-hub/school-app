// ─── Request type and status ──────────────────────────────────────────────────

export type RequestType =
    | 'LEAVE'
    | 'COMPLAINT'
    | 'BONAFIDE_CERTIFICATE'
    | 'TRANSFER_CERTIFICATE'
    | 'FEE_INQUIRY'
    | 'GENERAL_QUERY';

export type RequestStatus =
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'RESPONDED'
    | 'CLOSED';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// ─── Request summary (list view) ─────────────────────────────────────────────

export interface ParentRequestSummary {
    id: string;
    requestId: string;     // human-readable ref e.g. "REQ-202504-12345"
    requestType: RequestType;
    status: RequestStatus;
    priority: RequestPriority;
    subject: string;
    parentName: string;
    parentEmail: string;
    studentName?: string;
    className?: string;
    assignedToName?: string;
    slaDeadline?: string;
    isOverdue: boolean;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Request detail (with thread) ────────────────────────────────────────────

export interface ParentRequestDetail extends ParentRequestSummary {
    description: string;
    requestData?: Record<string, any>;
    messages: RequestMessage[];
}

// ─── Thread message ───────────────────────────────────────────────────────────

export interface RequestMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderType: 'parent' | 'school_user' | 'teacher';
    message: string;
    isInternal: boolean;
    createdAt: string;
}

// ─── Create request ───────────────────────────────────────────────────────────

export interface CreateRequestRequest {
    requestType: RequestType;
    subject: string;
    description: string;
    studentId?: string;
    priority?: RequestPriority;
    requestData?: Record<string, any>;
}

// ─── Request-type-specific data shapes ───────────────────────────────────────

export interface LeaveRequestData {
    startDate: string;          // "YYYY-MM-DD"
    endDate: string;
    reason: string;
}

export interface ComplaintData {
    category: 'Academic' | 'Behavioral' | 'Facility' | 'Teacher' | 'Other';
    urgency: RequestPriority;
    description: string;
}

export interface CertificateRequestData {
    purpose: string;
    requiredByDate: string;    // "YYYY-MM-DD"
}

export interface FeeInquiryData {
    description: string;
}

export interface GeneralQueryData {
    description: string;
}

// ─── Add message ─────────────────────────────────────────────────────────────

export interface AddMessageRequest {
    message: string;
    isInternal?: boolean;
}

// ─── Status config (stepper display) ─────────────────────────────────────────

export const REQUEST_STATUS_STEPS: RequestStatus[] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'RESPONDED',
    'CLOSED',
];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    LEAVE: 'Leave Request',
    COMPLAINT: 'Complaint',
    BONAFIDE_CERTIFICATE: 'Bonafide Certificate',
    TRANSFER_CERTIFICATE: 'Transfer Certificate',
    FEE_INQUIRY: 'Fee Inquiry',
    GENERAL_QUERY: 'General Query',
};

export const REQUEST_STATUS_COLOURS: Record<RequestStatus, string> = {
    SUBMITTED: '#6b7280',
    UNDER_REVIEW: '#d97706',
    RESPONDED: '#2563eb',
    CLOSED: '#16a34a',
};

export const REQUEST_PRIORITY_COLOURS: Record<RequestPriority, string> = {
    LOW: '#6b7280',
    MEDIUM: '#2563eb',
    HIGH: '#d97706',
    URGENT: '#dc2626',
};