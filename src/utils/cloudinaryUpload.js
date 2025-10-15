/**
 * Upload images to Cloudinary
 * Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET env variables
 */

export const uploadToCloudinary = async (file, onProgress = () => {}) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'uk-memories'); // Organize uploads in a folder

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    onProgress(100);

    return {
      url: data.secure_url,
      publicId: data.public_id,
      thumbnailUrl: data.secure_url.replace('/upload/', '/upload/c_thumb,w_200,h_150/'),
      originalFilename: file.name
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleToCloudinary = async (files, onProgress = () => {}) => {
  const total = files.length;
  const results = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadToCloudinary(files[i], (progress) => {
        const overallProgress = ((i / total) * 100) + (progress / total);
        onProgress(Math.round(overallProgress));
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${files[i].name}:`, error);
      // Continue with other uploads even if one fails
      results.push({ error: error.message, filename: files[i].name });
    }
  }

  return results;
};

/**
 * Check if Cloudinary is configured
 */
export const isCloudinaryConfigured = () => {
  return !!(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
};
