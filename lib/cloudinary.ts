const CLOUD_NAME = 'dybv5ghlb';

export type UploadType = 'image' | 'video' | 'audio' | 'raw';

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  duration?: number;
  width?: number;
  height?: number;
}

export const uploadToCloudinary = async (
  file: File | Blob,
  type: UploadType = 'image'
): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  formData.append('cloud_name', CLOUD_NAME);

  const resourceType = type === 'audio' ? 'video' : type === 'raw' ? 'raw' : type;

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error('Upload failed');
  }

  const data = await res.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    duration: data.duration,
    width: data.width,
    height: data.height,
  };
};

export const getCloudinaryUrl = (publicId: string, transforms?: string): string => {
  const base = `https://res.cloudinary.com/${CLOUD_NAME}`;
  if (transforms) {
    return `${base}/image/upload/${transforms}/${publicId}`;
  }
  return `${base}/image/upload/${publicId}`;
};
