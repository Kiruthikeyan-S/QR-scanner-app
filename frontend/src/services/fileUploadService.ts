import { Platform } from 'react-native';
import { UploadedFileMeta } from '../types/qr';
import { SettingsStorage } from '../storage/settingsStorage';

export interface FileUploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number; // 0 to 100
  errorMsg?: string;
}

export const FileUploadService = {
  async getBackendUrl(): Promise<string> {
    const settings = await SettingsStorage.get();
    let url = settings.backendUrl || 'http://localhost:8000';
    // Remove trailing slash
    return url.replace(/\/+$/, '');
  },

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

    // 2. Prepare Form Data
    const formData = new FormData();
    const cleanFileName = fileName || (fileType === 'photo' ? 'photo.jpg' : 'document.pdf');
    const cleanMime = mimeType || (fileType === 'photo' ? 'image/jpeg' : 'application/octet-stream');

    const filePayload: any = {
      uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
      name: cleanFileName,
      type: cleanMime,
    };

    formData.append('file', filePayload);
    formData.append('file_type', fileType);

    const baseUrl = await this.getBackendUrl();
    const uploadUrl = `${baseUrl}/api/v1/files/upload`;

    if (onProgress) onProgress(30);

    try {
      if (onProgress) onProgress(60);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Do not set Content-Type header manually in React Native so boundary is set automatically
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

      return {
        token_id: result.token_id,
        filename: result.filename,
        content_type: result.content_type || cleanMime,
        size_bytes: result.size_bytes || fileSize || 0,
        size_formatted: result.size_formatted || (fileSize ? this.formatBytes(fileSize) : 'Unknown'),
        file_type: fileType,
        view_url: result.view_url,
        download_url: result.download_url,
        qr_url: result.qr_url || result.view_url,
      };
    } catch (error: any) {
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Network unavailable. Make sure your device is connected to the backend network.');
      }
      throw error;
    }
  },
};
