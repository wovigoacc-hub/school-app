// ─── Base API response wrapper ────────────────────────────────────────────────
// Mirrors backend: common/utils/api-response.util.ts

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

// ─── API error shape ──────────────────────────────────────────────────────────

export interface ApiError {
    success: false;
    message: string;
    errors?: string[];      // validation field errors
    statusCode: number;
    path: string;
    timestamp: string;
}

// ─── RTK Query error ─────────────────────────────────────────────────────────

export interface RtkQueryError {
    status: number;
    data: ApiError;
}

// ─── Upload response shapes ───────────────────────────────────────────────────

export interface PresignedUploadResponse {
    uploadUrl: string;
    storageKey: string;
    expiresIn: number;
}

export interface ImageKitAuthToken {
    token: string;
    expire: number;
    nonce: string;
    folder: string;
    publicKey: string;
}

export interface FileRecord {
    id: string;
    storageKey: string;
    storageUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: FileCategory;
    schoolId: string;
    uploadedById: string;
    uploaderType: string;
    homeworkId?: string;
    announcementId?: string;
    requestId?: string;
    createdAt: string;
}

export type FileCategory =
    | 'PROFILE_PHOTO'
    | 'STUDENT_PHOTO'
    | 'SCHOOL_LOGO'
    | 'CIRCULAR_PDF'
    | 'HOMEWORK_ATTACHMENT'
    | 'REPORT_CARD_PDF'
    | 'CERTIFICATE_PDF';