import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { createPhotoRecord, uploadToS3, confirmUpload } from '@/services/photo-service';

interface UploadParams {
  uri: string;
  takenAt?: string;
}

export function usePhotoUpload() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ uri, takenAt }: UploadParams) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // 1. Create photo record and get pre-signed URL
      const { id, uploadUrl } = await createPhotoRecord(
        token,
        takenAt || new Date().toISOString()
      );

      console.log(`UPLOAD URL: ${uploadUrl}`)

      // 2. Upload binary to S3
      await uploadToS3(uploadUrl, uri);

      // 3. Confirm upload with backend
      return confirmUpload(token, id);
    },
  });
}
