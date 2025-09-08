/**
 * Web Camera Service
 * Provides camera and file handling functionality for web environments
 * Uses react-webcam for camera access and react-dropzone for file uploads
 */
import { dataURLToBlob, blobToDataURL } from '@/lib/utility';

class WebCameraService {
  constructor() {
    this.isInitialized = false;
    this.cameraConstraints = {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      facingMode: 'user', // Use front camera by default on mobile
    };
  }

  /**
   * Initialize the camera service
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera not supported in this browser');
        return false;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize camera service:', error);
      return false;
    }
  }

  /**
   * Check if camera access is available
   */
  async isAccessible() {
    await this.initialize();

    try {
      if (typeof window !== 'undefined') {
        if (!window.isSecureContext) {
          throw new Error('Camera requires a secure context (HTTPS).');
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not implemented in this browser.');
      }

      // Request permission by trying to access camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.cameraConstraints,
      });

      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error) {
      console.warn('Camera access denied or not available:', error?.message || error);
      return false;
    }
  }

  /**
   * Request camera permissions
   */
  async requestPermission() {
    try {
      const accessible = await this.isAccessible();
      return {
        granted: accessible,
        error: accessible ? null : 'Camera access denied',
      };
    } catch (error) {
      return {
        granted: false,
        error: error.message,
      };
    }
  }

  /**
   * Get camera constraints for different scenarios
   */
  getCameraConstraints(options = {}) {
    const {
      facingMode = 'user', // 'user' for front camera, 'environment' for rear
      width = 1920,
      height = 1080,
      aspectRatio,
    } = options;

    // Return constraints in the shape expected by react-webcam's videoConstraints prop
    // Mobile browsers (Android/Chrome) are picky about nested constraint objects.
    // Using top-level keys improves compatibility.
    const constraints = {
      facingMode,
      width,
      height,
    };

    if (aspectRatio) {
      constraints.aspectRatio = aspectRatio;
    }

    return constraints;
  }

  /**
   * Capture photo from webcam component
   * This method would be called with a webcam ref
   */
  capturePhoto(webcamRef, options = {}) {
    if (!webcamRef || !webcamRef.current) {
      throw new Error('Webcam reference not available');
    }

    const { format = 'image/jpeg', quality = 0.8 } = options;

    try {
      // Capture screenshot from webcam
      const imageSrc = webcamRef.current.getScreenshot({
        format,
        quality,
      });

      if (!imageSrc) {
        throw new Error('Failed to capture photo');
      }

      // Convert data URL to blob
      const blob = dataURLToBlob(imageSrc);

      return {
        success: true,
        uri: imageSrc,
        blob,
        timestamp: new Date().toISOString(),
        format,
        quality,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle file selection from input or drag-and-drop
   */
  async handleFileSelection(files, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      maxFiles = 1,
    } = options;

    if (!files || files.length === 0) {
      return {
        success: false,
        error: 'No files selected',
      };
    }

    // Limit number of files
    const filesToProcess = Array.from(files).slice(0, maxFiles);
    const results = [];

    for (const file of filesToProcess) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        results.push({
          success: false,
          error: `Unsupported file type: ${file.type}`,
          fileName: file.name,
        });
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        results.push({
          success: false,
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
          fileName: file.name,
        });
        continue;
      }

      try {
        const uri = URL.createObjectURL(file);
        const metadata = await this.getImageMetadata(file);

        results.push({
          success: true,
          file,
          uri,
          blob: file,
          fileName: file.name,
          fileSize: file.size,
          type: file.type,
          timestamp: new Date(file.lastModified).toISOString(),
          width: metadata.width,
          height: metadata.height,
        });
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to process file: ${error.message}`,
          fileName: file.name,
        });
      }
    }

    return {
      success: results.some((r) => r.success),
      results,
      validFiles: results.filter((r) => r.success),
    };
  }

  /**
   * Get image metadata from file or blob
   */
  async getImageMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!(file instanceof Blob)) {
        reject(new Error('Invalid file type'));
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Resize image to specified dimensions
   */
  async resizeImage(file, options = {}) {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'image/jpeg' } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const uri = URL.createObjectURL(blob);
              resolve({
                blob,
                uri,
                width,
                height,
                size: blob.size,
                format,
              });
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          format,
          quality,
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for resizing'));

      if (file instanceof Blob) {
        img.src = URL.createObjectURL(file);
      } else if (typeof file === 'string') {
        img.src = file;
      } else {
        reject(new Error('Invalid file format for resizing'));
      }
    });
  }

  /**
   * Convert data URL to blob
   */
  dataURLToBlob(dataURL) {
    // Deprecated: use shared utility instead
    return dataURLToBlob(dataURL);
  }

  /**
   * Convert blob to data URL
   */
  async blobToDataURL(blob) {
    // Deprecated: use shared utility instead
    return blobToDataURL(blob);
  }

  /**
   * Create a file input element (for backwards compatibility)
   */
  createFileInput(options = {}) {
    const { accept = 'image/*', multiple = false, capture, onChange } = options;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;

    if (capture) {
      input.setAttribute('capture', capture);
    }

    input.style.display = 'none';

    if (onChange) {
      input.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files || []);
        const result = await this.handleFileSelection(files, { maxFiles: multiple ? 10 : 1 });
        onChange(result);
      });
    }

    return input;
  }

  /**
   * Pick photo using file input (backwards compatibility)
   */
  async pickPhoto(options = {}) {
    const { multiple = false } = options;

    return new Promise((resolve) => {
      const input = this.createFileInput({
        accept: 'image/*',
        multiple,
        capture: 'environment', // Prefer rear camera on mobile
        onChange: (result) => {
          if (!result.success || result.validFiles.length === 0) {
            resolve({ cancelled: true });
            return;
          }

          const fileData = result.validFiles[0]; // Take first file for single selection

          resolve({
            cancelled: false,
            uri: fileData.uri,
            blob: fileData.blob,
            file: fileData.file,
            width: fileData.width,
            height: fileData.height,
            fileSize: fileData.fileSize,
            fileName: fileData.fileName,
            type: fileData.type,
            timestamp: fileData.timestamp,
            // Include all files for multiple selection
            assets: multiple ? result.validFiles : [fileData],
          });

          // Clean up
          document.body.removeChild(input);
        },
      });

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Save photo to downloads (web equivalent of saving to camera roll)
   */
  async savePhoto(uri, options = {}) {
    const { fileName = `photo_${Date.now()}.jpg` } = options;

    try {
      let blob;

      if (uri instanceof Blob) {
        blob = uri;
      } else if (typeof uri === 'string') {
        if (uri.startsWith('data:')) {
          blob = dataURLToBlob(uri);
        } else {
          // Fetch the image
          const response = await fetch(uri);
          blob = await response.blob();
        }
      } else {
        throw new Error('Invalid URI format');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);

      return {
        success: true,
        fileName,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const webCameraService = new WebCameraService();
export default webCameraService;
