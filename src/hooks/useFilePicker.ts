import { useState, useCallback } from 'react';
import DocumentPicker, {
    type DocumentPickerResponse,
    types as DocumentTypes,
} from 'react-native-document-picker';
import { useAppDispatch } from '../app/store';
import { showToast } from '../store/slices/uiSlice';
import { FILE_CONFIG } from '../constants/config';
import { API_BASE_URL } from '../constants/api.constants';
import type { FileCategory } from '../types/api.types';
import { axiosInstance } from '../services/root/api';

// ─── Result shape ─────────────────────────────────────────────────────────────

export interface UploadedFile {
    id: string;
    storageKey: string;
    storageUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: FileCategory;
}

// ─── Allowed MIME types per category ─────────────────────────────────────────

const CATEGORY_MIME_TYPES: Record<string, string[]> = {
    HOMEWORK_ATTACHMENT: [
        DocumentTypes.pdf,
        DocumentTypes.images,
    ],
    CIRCULAR_PDF: [DocumentTypes.pdf],
    REPORT_CARD_PDF: [DocumentTypes.pdf],
    CERTIFICATE_PDF: [DocumentTypes.pdf],
};

interface UseFilePickerReturn {
    isUploading: boolean;
    uploadFile: (
        category: FileCategory,
        linkedTo?: { homeworkId?: string; announcementId?: string; requestId?: string },
    ) => Promise<UploadedFile | null>;
    pickOnly: (category: FileCategory) => Promise<DocumentPickerResponse | null>;
}

/**
 * R2 two-step upload flow:
 * 1. Pick document (PDF / image) using DocumentPicker
 * 2. POST /mobile/teacher/files/upload-url → get presigned PUT URL + storageKey
 * 3. PUT file binary directly to R2 via the presigned URL
 * 4. POST /mobile/teacher/files/confirm → save FileUpload DB record
 *
 * Returns the confirmed FileUpload record on success, null on cancel/error.
 */
export function useFilePicker(): UseFilePickerReturn {
    const dispatch = useAppDispatch();
    const [isUploading, setIsUploading] = useState(false);

    // ─── Step 1: Pick document ───────────────────────────────────────────────

    const pickOnly = useCallback(
        async (category: FileCategory): Promise<DocumentPickerResponse | null> => {
            try {
                const allowedTypes = CATEGORY_MIME_TYPES[category] ?? [DocumentTypes.pdf];

                const result = await DocumentPicker.pickSingle({
                    type: allowedTypes,
                    copyTo: 'cachesDirectory',   // gives us a readable local URI
                    presentationStyle: 'pageSheet',
                });

                // Validate file size
                const maxBytes = category === 'HOMEWORK_ATTACHMENT'
                    ? FILE_CONFIG.MAX_HOMEWORK_SIZE_BYTES
                    : FILE_CONFIG.MAX_PDF_SIZE_BYTES;

                if (result.size && result.size > maxBytes) {
                    dispatch(
                        showToast({
                            type: 'error',
                            message: `File must be under ${maxBytes / (1024 * 1024)}MB`,
                            duration: 4000,
                        }),
                    );
                    return null;
                }

                return result;
            } catch (err) {
                if (DocumentPicker.isCancel(err)) return null;   // user dismissed
                dispatch(
                    showToast({
                        type: 'error',
                        message: 'Could not open file picker. Please try again.',
                        duration: 4000,
                    }),
                );
                return null;
            }
        },
        [dispatch],
    );

    // ─── Full upload flow ────────────────────────────────────────────────────

    const uploadFile = useCallback(
        async (
            category: FileCategory,
            linkedTo?: {
                homeworkId?: string;
                announcementId?: string;
                requestId?: string;
            },
        ): Promise<UploadedFile | null> => {
            const picked = await pickOnly(category);
            if (!picked) return null;

            setIsUploading(true);

            try {
                const mimeType = picked.type ?? 'application/pdf';
                const fileName = picked.name ?? `document_${Date.now()}.pdf`;
                const sizeBytes = picked.size ?? 0;
                const fileUri = picked.fileCopyUri ?? picked.uri;

                // ── Step 2: Get presigned upload URL from our server ─────────────
                const urlResponse = await axiosInstance.post(
                    `${API_BASE_URL}/mobile/teacher/files/upload-url`,
                    {
                        fileName,
                        mimeType,
                        sizeBytes,
                        category,
                        ...linkedTo,
                    },
                );

                const { uploadUrl, storageKey } = urlResponse.data.data;

                // ── Step 3: PUT file binary directly to R2 ───────────────────────
                // fetch() handles the binary stream — axios would base64 encode it
                const fileBlob = await fetch(fileUri).then((r) => r.blob());

                const putResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: fileBlob,
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Length': String(sizeBytes),
                    },
                });

                if (!putResponse.ok) {
                    throw new Error(`R2 upload failed: ${putResponse.status}`);
                }

                // ── Step 4: Confirm with our server ──────────────────────────────
                const confirmResponse = await axiosInstance.post(
                    `${API_BASE_URL}/mobile/teacher/files/confirm`,
                    {
                        storageKey,
                        fileName,
                        mimeType,
                        sizeBytes,
                        category,
                        ...linkedTo,
                    },
                );

                const confirmed = confirmResponse.data.data;

                dispatch(
                    showToast({
                        type: 'success',
                        message: `"${fileName}" uploaded`,
                        duration: 3000,
                    }),
                );

                return {
                    id: confirmed.id,
                    storageKey: confirmed.storageKey,
                    storageUrl: confirmed.storageUrl,
                    fileName: confirmed.fileName,
                    mimeType: confirmed.mimeType,
                    sizeBytes: confirmed.sizeBytes,
                    category: confirmed.category,
                };
            } catch (err: any) {
                dispatch(
                    showToast({
                        type: 'error',
                        message: err?.message ?? 'File upload failed. Please try again.',
                        duration: 4000,
                    }),
                );
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [dispatch, pickOnly],
    );

    return { isUploading, uploadFile, pickOnly };
}