import { apiRequest } from './api-client';

export interface PhotoResponse {
  id: string;
  uploadUrl: string;
}

export interface PhotoDetailResponse {
  id: string;
  userId: string;
  s3Key: string;
  status: string;
  takenAt: string;
}

/**
 * Creates a Photo record in the backend and returns a pre-signed S3 URL for upload.
 */
export async function createPhotoRecord(
  token: string,
  taken_at: string,
  file_hash?: string
): Promise<PhotoResponse> {
  return apiRequest<PhotoResponse>(
    '/photos',
    {
      method: 'POST',
      body: JSON.stringify({ taken_at, file_hash }),
    },
    token
  );
}

/**
 * Uploads a file directly to S3 using a pre-signed URL.
 */
export async function uploadToS3(
  url: string,
  localUri: string
): Promise<void> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'No error body');
      throw new Error(`S3 Upload failed with status ${uploadResponse.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('S3 Upload Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Confirms with the backend that the upload is complete.
 */
export async function confirmUpload(
  token: string,
  photoId: string
): Promise<PhotoDetailResponse> {
  return apiRequest<PhotoDetailResponse>(
    `/photos/${photoId}/confirm`,
    {
      method: 'POST',
    },
    token
  );
}
