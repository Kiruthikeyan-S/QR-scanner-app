import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { UploadedFileMeta } from '../types/qr';
import { getBaseApiUrl, getAllCandidateBaseUrls } from '../api/client';

export interface FileUploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number; // 0 to 100
  errorMsg?: string;
}

export const FileUploadService = {
  formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: 'photo' = 'photo',
    mimeType?: string,
    fileSize?: number,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFileMeta> {
    // 1. Validate Photo Size (10 MB max)
    const maxPhotoSize = 10 * 1024 * 1024; // 10 MB

    if (fileSize && fileSize > maxPhotoSize) {
      throw new Error(`Photo is larger than the allowed 10 MB limit (${this.formatBytes(fileSize)}).`);
    }

    const cleanFileName = fileName || 'photo.jpg';
    const cleanMime = mimeType || 'image/jpeg';

    const candidates = await getAllCandidateBaseUrls();
    let lastError: any = null;

    if (onProgress) onProgress(20);

    // Native Android & iOS: Use expo-file-system/legacy uploadAsync with multi-endpoint fallback
    if (Platform.OS !== 'web' && typeof uploadAsync === 'function') {
      for (const baseUrl of candidates) {
        const uploadUrl = `${baseUrl}/files/upload`;
        try {
          if (onProgress) onProgress(45);
          const response = await uploadAsync(uploadUrl, fileUri, {
            httpMethod: 'POST',
            uploadType: FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            parameters: {
              file_type: fileType,
            },
            headers: {
              Accept: 'application/json',
            },
          });

          if (response.status >= 200 && response.status < 300) {
            if (onProgress) onProgress(100);
            const result = JSON.parse(response.body);
            const fileId = result.file_id || result.token_id;
            const targetUrl = result.url || result.view_url || result.qr_url;

            return {
              token_id: fileId,
              file_id: fileId,
              filename: result.file_name || result.filename || cleanFileName,
              content_type: result.mime_type || result.content_type || cleanMime,
              size_bytes: result.file_size || result.size_bytes || fileSize || 0,
              size_formatted: result.size_formatted || (fileSize ? this.formatBytes(fileSize) : 'Unknown'),
              file_type: fileType,
              view_url: targetUrl,
              url: targetUrl,
              download_url: result.download_url || `${baseUrl}/files/download/${fileId}`,
              qr_url: targetUrl,
            };
          } else {
            let errMsg = `Server returned status ${response.status}`;
            try {
              const errJson = JSON.parse(response.body);
              if (errJson.detail) errMsg = errJson.detail;
            } catch {}
            lastError = new Error(errMsg);
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      const triedIps = candidates.join(', ');
      throw new Error(
        lastError?.message ||
        `Cannot connect to backend server (tried: ${triedIps}). Ensure backend is running and phone is on the same Wi-Fi.`
      );
    }

    // Web Platform: Use standard fetch with Blob FormData
    for (const baseUrl of candidates) {
      const uploadUrl = `${baseUrl}/files/upload`;
      try {
        if (onProgress) onProgress(40);
        const res = await fetch(fileUri);
        const blob = await res.blob();

        const formData = new FormData();
        formData.append('file', blob, cleanFileName);
        formData.append('file_type', fileType);

        if (onProgress) onProgress(70);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          if (onProgress) onProgress(100);
          const result = await response.json();
          const fileId = result.file_id || result.token_id;
          const targetUrl = result.url || result.view_url || result.qr_url;

          return {
            token_id: fileId,
            file_id: fileId,
            filename: result.file_name || result.filename || cleanFileName,
            content_type: result.mime_type || result.content_type || cleanMime,
            size_bytes: result.file_size || result.size_bytes || fileSize || 0,
            size_formatted: result.size_formatted || (fileSize ? this.formatBytes(fileSize) : 'Unknown'),
            file_type: fileType,
            view_url: targetUrl,
            url: targetUrl,
            download_url: result.download_url || `${baseUrl}/files/download/${fileId}`,
            qr_url: targetUrl,
          };
        } else {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson.detail || `Server returned error ${response.status}`;
          lastError = new Error(errMsg);
        }
      } catch (error: any) {
        lastError = error;
      }
    }

    throw new Error(lastError?.message || 'Network request failed. Ensure backend server is reachable.');
  },
};
