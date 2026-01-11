/**
 * Firebase Storage service for image uploads
 * Handles hero image upload for login page customization
 */
import { storage } from '@lib/firebase';

const HERO_IMAGES_PATH = 'hero-images';

/**
 * Upload a hero image to Firebase Storage
 * @param file - The image file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns The download URL of the uploaded image
 */
export const uploadHeroImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `hero-${timestamp}-${file.name}`;
  const storageRef = storage.ref(`${HERO_IMAGES_PATH}/${fileName}`);

  const uploadTask = storageRef.put(file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Error uploading hero image:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Delete a hero image from Firebase Storage
 * @param url - The download URL of the image to delete
 */
export const deleteHeroImage = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const storageRef = storage.refFromURL(url);
    await storageRef.delete();
  } catch (error) {
    console.error('Error deleting hero image:', error);
    throw error;
  }
};

/**
 * Validate that a file is an acceptable image type
 * @param file - The file to validate
 * @returns true if valid image, false otherwise
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Get the maximum file size for hero images (5MB)
 */
export const MAX_HERO_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate file size
 * @param file - The file to validate
 * @returns true if within size limit, false otherwise
 */
export const isValidFileSize = (file: File): boolean => {
  return file.size <= MAX_HERO_IMAGE_SIZE;
};
