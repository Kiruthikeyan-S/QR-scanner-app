import * as FileSystem from 'expo-file-system';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { UploadedFileMeta } from '../types/qr';
import { getBaseApiUrl } from '../api/client';

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
    fileType: 'photo' | 'file',
    mimeType?: string,
    fileSize?: number,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFileMeta> {
    // 1. Validate File Size
    const maxPhotoSize = 10 * 1024 * 1024; // 10 MB
    const maxFileSize = 25 * 1024 * 1024;  // 25 MB
    const maxAllowed = fileType === 'photo' ? maxPhotoSize : maxFileSize;
    const maxLabel = fileType === 'photo' ? '10 MB' : '25 MB';

    if (fileSize && fileSize > maxAllowed) {
      throw new Error(`File is larger than the allowed ${maxLabel} limit (${this.formatBytes(fileSize)}).`);
    }

    const cleanFileName = fileName || (fileType === 'photo' ? 'photo.jpg' : 'document.pdf');
    const cleanMime = mimeType || (fileType === 'photo' ? 'image/jpeg' : 'application/pdf');

    const baseUrl = await getBaseApiUrl();
    const uploadUrl = `${baseUrl}/api/v1/files/upload`;

    if (onProgress) onProgress(20);

    // Try native FileSystem.uploadAsync on iOS & Android
    if (Platform.OS !== 'web' && typeof FileSystem.uploadAsync === 'function') {
      try {
        if (onProgress) onProgress(50);
        const response = await FileSystem.uploadAsync(uploadUrl, fileUri, {
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

        if (onProgress) onProgress(90);

        if (response.status < 200 || response.status >= 300) {
          let errMsg = `Server returned status ${response.status}`;
          try {
            const errJson = JSON.parse(response.body);
            if (errJson.detail) errMsg = errJson.detail;
          } catch {}
          throw new Error(errMsg);
        }

        const result = JSON.parse(response.body);
        if (onProgress) onProgress(100);

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
      } catch (err: any) {
        if (err.message && (err.message.includes('Network') || err.message.includes('connection') || err.message.includes('Failed to connect'))) {
          throw new Error(`Cannot connect to backend server at ${baseUrl}. Ensure backend is running and phone is on the same Wi-Fi.`);
        }
        console.warn('FileSystem.uploadAsync error, attempting fetch fallback...', err);
      }
    }

    // Fallback: Standard fetch with FormData
    const formData = new FormData();
    const filePayload: any = {
      uri: fileUri,
      name: cleanFileName,
      type: cleanMime,
    };

    formData.append('file', filePayload);
    formData.append('file_type', fileType);

    try {
      if (onProgress) onProgress(60);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (onProgress) onProgress(90);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.detail || `Server returned error ${response.status}`;
        throw new Error(errMsg);
      }

      const result = await response.json();
      if (onProgress) onProgress(100);

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
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to backend server at ${baseUrl}. Make sure your phone is connected to the same Wi-Fi.`);
      }
      throw error;
    }
  },
};
