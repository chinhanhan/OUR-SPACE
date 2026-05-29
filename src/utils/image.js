/**
 * Client-side image compression utility using HTML5 Canvas.
 * Compresses any image to standard Web JPEG format while keeping
 * size and quality balanced to save Supabase storage space.
 */
export const compressImage = (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = {}) => {
  return new Promise((resolve) => {
    // If not a valid image file, skip compression and return original file
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate target scale maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas back to a compressed JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Wrap blob as a File object to preserve structure
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log(
              `[Image Compressor] "${file.name}" compressed successfully! ` +
              `Original: ${(file.size / 1024).toFixed(1)}KB, ` +
              `Compressed: ${(compressedFile.size / 1024).toFixed(1)}KB ` +
              `(${(100 - (compressedFile.size / file.size) * 100).toFixed(0)}% space saved)`
            );
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
