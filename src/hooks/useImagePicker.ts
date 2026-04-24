import { useState, useCallback } from 'react';
import {
    launchImageLibrary,
    launchCamera,
    type ImagePickerResponse,
    type Asset,
} from 'react-native-image-picker';
import { useAppDispatch } from '../app/store';
import { showToast } from '../store/slices/uiSlice';
import { FILE_CONFIG } from '../constants/config';
import type { FileCategory } from '../types/api.types';
import { axiosInstance } from '../services/root/api';
import { API_BASE_URL } from '../constants/api.constants';

// ─── Result shape ─────────────────────────────────────────────────────────────

export interface UploadedImage {
    fileId: string;
    url: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
}

interface UseImagePickerReturn {
    isUploading: boolean;
    uploadImage: (category: FileCategory, source?: 'gallery' | 'camera') => Promise<UploadedImage | null>;
    pickOnly: (source?: 'gallery' | 'camera') => Promise<Asset | null>;
}

/**
 * ImageKit two-step upload flow:
 * 1. Pick image from gallery or camera
 * 2. POST /mobile/imagekit/auth → get signed token
 * 3. Upload directly to ImageKit CDN using their SDK/fetch
 * 4. POST /mobile/imagekit/confirm → save FileUpload DB record
 *
 * Returns the confirmed FileUpload record on success, null on cancel/error.
 */
export function useImagePicker(): UseImagePickerReturn {
    const dispatch = useAppDispatch();
    const [isUploading, setIsUploading] = useState(false);

    // ─── Step 1: Pick image ──────────────────────────────────────────────────

    const pickOnly = useCallback(
        async (source: 'gallery' | 'camera' = 'gallery'): Promise<Asset | null> => {
            const options = {
                mediaType: 'photo' as const,
                maxWidth: 2048,
                maxHeight: 2048,
                quality: 0.8 as const,
                includeBase64: false,
            };

            let response: ImagePickerResponse;

            if (source === 'camera') {
                response = await launchCamera(options);
            } else {
                response = await launchImageLibrary(options);
            }

            if (response.didCancel || response.errorCode) return null;

            const asset = response.assets?.[0];
            if (!asset?.uri) return null;

            // Validate file size
            if (asset.fileSize && asset.fileSize > FILE_CONFIG.MAX_IMAGE_SIZE_BYTES) {
                dispatch(
                    showToast({
                        type: 'error',
                        message: `Image must be under ${FILE_CONFIG.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`,
                        duration: 4000,
                    }),
                );
                return null;
            }

            return asset;
        },
        [dispatch],
    );

    // ─── Full upload flow ────────────────────────────────────────────────────

    const uploadImage = useCallback(
        async (
            category: FileCategory,
            source: 'gallery' | 'camera' = 'gallery',
        ): Promise<UploadedImage | null> => {
            const asset = await pickOnly(source);
            if (!asset) return null;

            setIsUploading(true);

            try {
                // ── Step 2: Get ImageKit auth token ──────────────────────────────
                const authResponse = await axiosInstance.post(
                    `${API_BASE_URL}/mobile/imagekit/auth`,
                    { category },
                );
                const { token, expire, nonce, folder, publicKey } = authResponse.data.data;

                // ── Step 3: Upload directly to ImageKit ──────────────────────────
                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri!,
                    type: asset.type ?? 'image/jpeg',
                    name: asset.fileName ?? `upload_${Date.now()}.jpg`,
                } as any);
                formData.append('fileName', asset.fileName ?? `upload_${Date.now()}.jpg`);
                formData.append('publicKey', publicKey);
                formData.append('signature', token);
                formData.append('expire', String(expire));
                formData.append('token', nonce);
                formData.append('folder', folder);

                const ikResponse = await fetch(
                    'https://upload.imagekit.io/api/v1/files/upload',
                    {
                        method: 'POST',
                        body: formData,
                    },
                );

                if (!ikResponse.ok) {
                    throw new Error(`ImageKit upload failed: ${ikResponse.status}`);
                }

                const ikData = await ikResponse.json();

                // ── Step 4: Confirm with our server ──────────────────────────────
                const confirmResponse = await axiosInstance.post(
                    `${API_BASE_URL}/mobile/imagekit/confirm`,
                    {
                        fileId: ikData.fileId,
                        url: ikData.url,
                        fileName: ikData.name,
                        mimeType: asset.type ?? 'image/jpeg',
                        sizeBytes: asset.fileSize ?? 0,
                        category,
                    },
                );

                const confirmed = confirmResponse.data.data;

                dispatch(
                    showToast({
                        type: 'success',
                        message: 'Image uploaded successfully',
                        duration: 2000,
                    }),
                );

                return {
                    fileId: confirmed.fileId,
                    url: confirmed.url,
                    fileName: confirmed.fileName,
                    mimeType: confirmed.mimeType,
                    sizeBytes: confirmed.sizeBytes,
                };
            } catch (err: any) {
                dispatch(
                    showToast({
                        type: 'error',
                        message: err?.message ?? 'Image upload failed. Please try again.',
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

    return { isUploading, uploadImage, pickOnly };
}