import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { UploadedFileMeta } from '../types/qr';
import { getAllCandidateBaseUrls } from '../api/client';

export interface FileUploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number; // 0 to 100
  bytesSent?: number;
  totalBytes?: number;
  errorMsg?: string;
}

export const FileUploadService = {
  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: 'photo' | 'file' = 'photo',
    mimeType?: string,
    fileSize?: number,
    onProgress?: (progress: number, bytesSent?: number, totalBytes?: number) => void
  ): Promise<UploadedFileMeta> {
    const startTime = Date.now();
    const cleanFileName = fileName || (fileType === 'photo' ? 'photo.jpg' : 'document.pdf');
    const cleanMime = mimeType || (fileType === 'photo' ? 'image/jpeg' : 'application/pdf');

    // 1. Validate File Size Limits
    const maxPhotoSize = 10 * 1024 * 1024; // 10 MB
    const maxPdfSize = 25 * 1024 * 1024;   // 25 MB
    const maxAllowed = fileType === 'photo' ? maxPhotoSize : maxPdfSize;

    if (fileSize && fileSize > maxAllowed) {
      throw new Error(`File size (${this.formatBytes(fileSize)}) exceeds the ${this.formatBytes(maxAllowed)} limit.`);
    }

    const prepTime = Date.now() - startTime;
    if (onProgress) onProgress(15, 0, fileSize || 0);

    const candidates = await getAllCandidateBaseUrls();
    let lastError: any = null;
    const uploadStartTime = Date.now();

    // Native Platforms (iOS / Android) using direct multipart streaming
    if (Platform.OS !== 'web' && typeof uploadAsync === 'function') {
      for (const baseUrl of candidates) {
        const uploadUrl = `${baseUrl}/files/upload`;
        try {
          if (onProgress) onProgress(35, Math.round((fileSize || 1000) * 0.35), fileSize || 1000);

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

          const networkTime = Date.now() - uploadStartTime;

          if (response.status >= 200 && response.status < 300) {
            if (onProgress) onProgress(100, fileSize || 1000, fileSize || 1000);
            const parseStart = Date.now();
            const result = JSON.parse(response.body);
            const fileId = result.file_id || result.token_id;
            const targetUrl = result.url || result.view_url || result.qr_url;
            const parseTime = Date.now() - parseStart;
            const totalDuration = Date.now() - startTime;

            console.log(
              `[QR PERFORMANCE] Type=${fileType.toUpperCase()} | Prep=${prepTime}ms | Upload=${networkTime}ms | Parse=${parseTime}ms | Total=${totalDuration}ms | Provider=${result.storage_provider || 'supabase'}`
            );

            return {
              token_id: fileId,
              file_id: fileId,
              original_name: result.original_name || result.file_name || cleanFileName,
              filename: result.file_name || result.filename || cleanFileName,
              content_type: result.mime_type || result.content_type || cleanMime,
              file_category: result.file_category || (fileType === 'photo' ? 'image' : 'file'),
              file_type_label: result.file_type_label || (fileType === 'photo' ? 'Image File' : 'Document'),
              size_bytes: result.file_size || result.size_bytes || fileSize || 0,
              size_formatted: result.size_formatted || (fileSize ? this.formatBytes(fileSize) : 'Unknown'),
              file_type: fileType,
              storage_path: result.storage_path || '',
              view_url: targetUrl,
              url: targetUrl,
              download_url: result.download_url || `${baseUrl}/files/download/${fileId}`,
              qr_url: targetUrl,
              storage_provider: result.storage_provider || 'supabase',
              is_supabase: result.is_supabase ?? true,
            };
          } else {
            let errMsg = `Upload failed with status ${response.status}`;
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
        `Cannot reach QR Smart backend (${triedIps}). Ensure the server is running.`
      );
    }

    // Web Platform (Browser) using FormData
    for (const baseUrl of candidates) {
      const uploadUrl = `${baseUrl}/files/upload`;
      try {
        if (onProgress) onProgress(30, Math.round((fileSize || 1000) * 0.3), fileSize || 1000);
        const res = await fetch(fileUri);
        const blob = await res.blob();

        const formData = new FormData();
        formData.append('file', blob, cleanFileName);
        formData.append('file_type', fileType);

        if (onProgress) onProgress(70, Math.round((fileSize || 1000) * 0.7), fileSize || 1000);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });

        const networkTime = Date.now() - uploadStartTime;

        if (response.ok) {
          if (onProgress) onProgress(100, fileSize || 1000, fileSize || 1000);
          const result = await response.json();
          const fileId = result.file_id || result.token_id;
          const targetUrl = result.url || result.view_url || result.qr_url;
          const totalDuration = Date.now() - startTime;

          console.log(
            `[QR PERFORMANCE] (Web) Type=${fileType.toUpperCase()} | Upload=${networkTime}ms | Total=${totalDuration}ms`
          );

          return {
            token_id: fileId,
            file_id: fileId,
            original_name: result.original_name || result.file_name || cleanFileName,
            filename: result.file_name || result.filename || cleanFileName,
            content_type: result.mime_type || result.content_type || cleanMime,
            file_category: result.file_category || (fileType === 'photo' ? 'image' : 'file'),
            file_type_label: result.file_type_label || (fileType === 'photo' ? 'Image File' : 'Document'),
            size_bytes: result.file_size || result.size_bytes || fileSize || 0,
            size_formatted: result.size_formatted || (fileSize ? this.formatBytes(fileSize) : 'Unknown'),
            file_type: fileType,
            storage_path: result.storage_path || '',
            view_url: targetUrl,
            url: targetUrl,
            download_url: result.download_url || `${baseUrl}/files/download/${fileId}`,
            qr_url: targetUrl,
            storage_provider: result.storage_provider || 'supabase',
            is_supabase: result.is_supabase ?? true,
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
