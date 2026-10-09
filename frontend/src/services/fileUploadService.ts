import { UploadedFileMeta } from '../types/qr';
import { SupabaseStorageService } from './supabaseStorageService';

export interface FileUploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number; // 0 to 100
  bytesSent?: number;
  totalBytes?: number;
  errorMsg?: string;
}

export const FileUploadService = {
  formatBytes(bytes: number, decimals = 1): string {
    return SupabaseStorageService.formatBytes(bytes, decimals);
  },

  /**
   * Direct Upload to Supabase Storage:
   * Completely bypasses localhost / 127.0.0.1 and streams directly
   * from the Expo app to Supabase Cloud Storage.
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: 'photo' | 'file' = 'photo',
    mimeType?: string,
    fileSize?: number,
    onProgress?: (progress: number, bytesSent?: number, totalBytes?: number) => void
  ): Promise<UploadedFileMeta> {
    return SupabaseStorageService.uploadFile(
      fileUri,
      fileName,
      fileType,
      mimeType,
      fileSize,
      onProgress
    );
  },
};
