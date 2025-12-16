/**
 * Upload images to Cloudinary
 * Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET env variables
 */

// Image compression settings
const COMPRESSION_CONFIG = {
  maxWidth: 2048,        // Max width in pixels (good for web display)
  maxHeight: 2048,       // Max height in pixels
  quality: 0.85,         // JPEG quality (0.85 = good balance of quality/size)
  maxFileSizeMB: 2,      // Target max file size in MB
  skipCompressionBelow: 500 * 1024  // Skip compression for files under 500KB
};

/**
 * Extract EXIF metadata from image file
 * Returns basic metadata that can be passed to AI/LLM
 */
export const extractImageMetadata = async (file) => {
  return new Promise((resolve) => {
    const metadata = {
      filename: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null
    };

    // Try to read EXIF data using FileReader and basic parsing
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        // Check for JPEG
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(metadata);
          return;
        }

        let offset = 2;
        const length = view.byteLength;

        while (offset < length) {
          if (view.getUint8(offset) !== 0xFF) {
            resolve(metadata);
            return;
          }

          const marker = view.getUint8(offset + 1);

          // APP1 marker (EXIF)
          if (marker === 0xE1) {
            const exifOffset = offset + 4;
            const exifString = String.fromCharCode(
              view.getUint8(exifOffset),
              view.getUint8(exifOffset + 1),
              view.getUint8(exifOffset + 2),
              view.getUint8(exifOffset + 3)
            );

            if (exifString === 'Exif') {
              metadata.hasExif = true;
              // Basic EXIF presence detection - full parsing would require a library
              // For AI/LLM use, Cloudinary preserves and can return this data
            }
          }

          if (marker === 0xDA) break; // Start of scan

          const segmentLength = view.getUint16(offset + 2, false);
          offset += 2 + segmentLength;
        }
      } catch (_err) {
        // Silently fail - metadata extraction is optional
      }
      resolve(metadata);
    };
    reader.onerror = () => resolve(metadata);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Only read first 64KB for EXIF
  });
};

/**
 * Compress image file while maintaining reasonable quality
 * Preserves original if already small enough
 */
export const compressImage = async (file, config = COMPRESSION_CONFIG) => {
  // Skip compression for small files
  if (file.size < config.skipCompressionBelow) {
    return { file, wasCompressed: false, originalSize: file.size };
  }

  // Skip non-image files
  if (!file.type.startsWith('image/')) {
    return { file, wasCompressed: false, originalSize: file.size };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        let { width, height } = img;
        const originalSize = file.size;

        // Calculate new dimensions maintaining aspect ratio
        if (width > config.maxWidth || height > config.maxHeight) {
          const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image with white background (for transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, wasCompressed: false, originalSize });
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: file.lastModified
            });

            // Only use compressed if actually smaller
            if (compressedFile.size < originalSize) {
              resolve({
                file: compressedFile,
                wasCompressed: true,
                originalSize,
                compressedSize: compressedFile.size,
                compressionRatio: ((originalSize - compressedFile.size) / originalSize * 100).toFixed(1)
              });
            } else {
              resolve({ file, wasCompressed: false, originalSize });
            }
          },
          'image/jpeg',
          config.quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Cleanup object URL after load
    img.onload = ((originalOnload) => function() {
      URL.revokeObjectURL(objectUrl);
      originalOnload.call(this);
    })(img.onload);
  });
};

export const uploadToCloudinary = async (file, onProgress = () => {}, options = {}) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const { skipCompression = false } = options;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file');
  }

  // Compress image before upload (unless disabled)
  let fileToUpload = file;
  let compressionInfo = null;

  if (!skipCompression && file.type.startsWith('image/')) {
    try {
      const result = await compressImage(file);
      fileToUpload = result.file;
      compressionInfo = {
        wasCompressed: result.wasCompressed,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio
      };
      if (result.wasCompressed) {
        console.log(`📦 Compressed ${file.name}: ${(result.originalSize / 1024 / 1024).toFixed(2)}MB → ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB (${result.compressionRatio}% reduction)`);
      }
    } catch (compressError) {
      console.warn('Compression failed, uploading original:', compressError);
      // Continue with original file
    }
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
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
      originalFilename: file.name,
      compression: compressionInfo,
      // Include EXIF info if available from Cloudinary response
      exif: data.image_metadata || null,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Photo limits for capsules
export const PHOTO_LIMITS = {
  maxPhotosPerCapsule: 100,       // Maximum photos allowed per capsule
  maxTotalSizeMB: 50,             // Maximum total size per capsule in MB
  warnAtPhotos: 80                // Show warning when reaching this count
};

/**
 * Upload multiple images to Cloudinary
 * Includes photo limit checking
 */
export const uploadMultipleToCloudinary = async (files, onProgress = () => {}, options = {}) => {
  const { existingPhotoCount = 0 } = options;
  const total = files.length;
  const results = [];

  // Check photo limit before uploading
  const totalAfterUpload = existingPhotoCount + total;
  if (totalAfterUpload > PHOTO_LIMITS.maxPhotosPerCapsule) {
    const remaining = PHOTO_LIMITS.maxPhotosPerCapsule - existingPhotoCount;
    throw new Error(
      `Photo limit exceeded. Maximum ${PHOTO_LIMITS.maxPhotosPerCapsule} photos per capsule. ` +
      `You have ${existingPhotoCount} photos and can add ${Math.max(0, remaining)} more.`
    );
  }

  // Warn if approaching limit
  if (totalAfterUpload >= PHOTO_LIMITS.warnAtPhotos) {
    console.warn(`⚠️ Photo limit warning: ${totalAfterUpload}/${PHOTO_LIMITS.maxPhotosPerCapsule} photos after upload`);
  }

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadToCloudinary(files[i], (progress) => {
        const overallProgress = ((i / total) * 100) + (progress / total);
        onProgress(Math.round(overallProgress));
      }, options);
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
