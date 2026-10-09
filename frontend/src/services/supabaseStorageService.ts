import { Platform } from 'react-native';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { supabase, isSupabaseConfigured, SUPABASE_BUCKET } from '../lib/supabase';
import { UploadedFileMeta } from '../types/qr';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;  // 25 MB

export interface FileClassification {
  folder: 'photos' | 'pdfs' | 'files';
  category: 'image' | 'pdf' | 'spreadsheet' | 'document' | 'json' | 'text' | 'archive' | 'file';
  label: string;
  mimeType: string;
}

export const SupabaseStorageService = {
  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  generateRandomId(prefix = 'F-'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${token}`;
  },

  sanitizeExt(filename: string, defaultExt = 'bin'): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';
      return ext || defaultExt;
    }
    return defaultExt;
  },

  classifyFile(filename: string, declaredType?: 'photo' | 'file', rawMime?: string): FileClassification {
    const ext = this.sanitizeExt(filename);
    const mime = rawMime || '';

    // Photos / Images
    if (
      declaredType === 'photo' ||
      ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) ||
      mime.startsWith('image/')
    ) {
      const resolvedMime = mime.startsWith('image/')
        ? mime
        : ext === 'png'
        ? 'image/png'
        : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
        ? 'image/gif'
        : ext === 'svg'
        ? 'image/svg+xml'
        : 'image/jpeg';
      return {
        folder: 'photos',
        category: 'image',
        label: 'Image File',
        mimeType: resolvedMime,
      };
    }

    // PDF Documents
    if (ext === 'pdf' || mime === 'application/pdf') {
      return {
        folder: 'pdfs',
        category: 'pdf',
        label: 'PDF Document',
        mimeType: 'application/pdf',
      };
    }

    // Excel Spreadsheets
    if (['xlsx', 'xls'].includes(ext)) {
      return {
        folder: 'files',
        category: 'spreadsheet',
        label: 'Excel Spreadsheet',
        mimeType:
          ext === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/vnd.ms-excel',
      };
    }

    // CSV Spreadsheets
    if (ext === 'csv' || mime === 'text/csv') {
      return {
        folder: 'files',
        category: 'spreadsheet',
        label: 'CSV Spreadsheet',
        mimeType: 'text/csv',
      };
    }

    // Word Documents
    if (['docx', 'doc'].includes(ext)) {
      return {
        folder: 'files',
        category: 'document',
        label: 'Word Document',
        mimeType:
          ext === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/msword',
      };
    }

    // JSON Files
    if (ext === 'json' || mime === 'application/json') {
      return {
        folder: 'files',
        category: 'json',
        label: 'JSON File',
        mimeType: 'application/json',
      };
    }

    // Text Files
    if (['txt', 'text', 'md', 'log'].includes(ext) || mime.startsWith('text/plain')) {
      return {
        folder: 'files',
        category: 'text',
        label: 'Text File',
        mimeType: 'text/plain; charset=utf-8',
      };
    }

    // ZIP / Archives
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return {
        folder: 'files',
        category: 'archive',
        label: 'ZIP Archive',
        mimeType: 'application/zip',
      };
    }

    // Generic Document
    return {
      folder: 'files',
      category: 'file',
      label: 'Document',
      mimeType: mime || 'application/octet-stream',
    };
  },

  /**
   * Direct Upload to Supabase Storage:
   * Uploads file directly from the mobile app to the Supabase qr-files bucket,
   * completely bypassing localhost / 127.0.0.1.
   */
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
    const classification = this.classifyFile(cleanFileName, fileType, mimeType);

    // 1. Validate File Size Boundaries
    const maxAllowed = classification.category === 'image' ? MAX_PHOTO_SIZE : MAX_FILE_SIZE;
    if (fileSize && fileSize > maxAllowed) {
      throw new Error(
        `File size (${this.formatBytes(fileSize)}) exceeds the ${this.formatBytes(maxAllowed)} limit.`
      );
    }

    // 2. Check Supabase Configuration
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase Storage is not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to frontend/.env.'
      );
    }

    const ext = this.sanitizeExt(cleanFileName, classification.category === 'image' ? 'jpg' : 'pdf');
    const prefix = classification.category === 'image' ? 'P-' : classification.category === 'pdf' ? 'F-PDF-' : 'F-';
    const fileId = this.generateRandomId(prefix);

    // Storage path: photos/<random-id>.jpg or pdfs/<random-id>.pdf or files/<random-id>.xlsx
    const randomHex = Math.random().toString(36).substring(2, 10);
    const storagePath = `${classification.folder}/${randomHex}.${ext}`;
    const bucket = SUPABASE_BUCKET || 'qr-files';

    const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
    const supabaseKey = (
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ).trim();

    if (onProgress) onProgress(20, Math.round((fileSize || 1000) * 0.2), fileSize || 1000);

    // 3. Native Android / iOS Upload using direct binary stream to Supabase Storage REST API
    if (Platform.OS !== 'web' && typeof uploadAsync === 'function') {
      const restUploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

      if (onProgress) onProgress(45, Math.round((fileSize || 1000) * 0.45), fileSize || 1000);

      try {
        const response = await uploadAsync(restUploadUrl, fileUri, {
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': classification.mimeType,
            'x-upsert': 'true',
          },
        });

        if (response.status >= 200 && response.status < 300) {
          if (onProgress) onProgress(100, fileSize || 1000, fileSize || 1000);

          const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
          const publicUrl = data.publicUrl;

          const totalDuration = Date.now() - startTime;
          console.log(
            `[SUPABASE UPLOAD OK] Direct Native -> ${publicUrl} (${totalDuration}ms)`
          );

          return {
            token_id: fileId,
            file_id: fileId,
            original_name: cleanFileName,
            filename: cleanFileName,
            content_type: classification.mimeType,
            file_category: classification.category,
            file_type_label: classification.label,
            size_bytes: fileSize || 0,
            size_formatted: fileSize ? this.formatBytes(fileSize) : 'Unknown',
            file_type: fileType,
            storage_path: storagePath,
            view_url: publicUrl,
            url: publicUrl,
            download_url: publicUrl,
            qr_url: publicUrl,
            storage_provider: 'supabase',
            is_supabase: true,
          };
        } else {
          let errDetail = `Status ${response.status}`;
          try {
            const errBody = JSON.parse(response.body);
            errDetail = errBody.message || errBody.error || response.body;
          } catch {}
          throw new Error(`Supabase Storage upload error: ${errDetail}`);
        }
      } catch (err: any) {
        console.error('[SUPABASE DIRECT UPLOAD FAILED]', err);
        throw new Error(
          err.message || 'Direct upload to Supabase Storage failed. Please check network and Storage bucket RLS policies.'
        );
      }
    }

    // 4. Web Platform (Browser) using Blob fetch -> supabase.storage.upload
    try {
      if (onProgress) onProgress(40, Math.round((fileSize || 1000) * 0.4), fileSize || 1000);

      const res = await fetch(fileUri);
      const blob = await res.blob();

      if (onProgress) onProgress(70, Math.round((fileSize || 1000) * 0.7), fileSize || 1000);

      const { error } = await supabase.storage.from(bucket).upload(storagePath, blob, {
        contentType: classification.mimeType,
        upsert: true,
      });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      if (onProgress) onProgress(100, fileSize || 1000, fileSize || 1000);

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = data.publicUrl;

      const totalDuration = Date.now() - startTime;
      console.log(`[SUPABASE UPLOAD OK] Direct Web -> ${publicUrl} (${totalDuration}ms)`);

      return {
        token_id: fileId,
        file_id: fileId,
        original_name: cleanFileName,
        filename: cleanFileName,
        content_type: classification.mimeType,
        file_category: classification.category,
        file_type_label: classification.label,
        size_bytes: fileSize || blob.size || 0,
        size_formatted: this.formatBytes(fileSize || blob.size || 0),
        file_type: fileType,
        storage_path: storagePath,
        view_url: publicUrl,
        url: publicUrl,
        download_url: publicUrl,
        qr_url: publicUrl,
        storage_provider: 'supabase',
        is_supabase: true,
      };
    } catch (err: any) {
      console.error('[SUPABASE WEB UPLOAD FAILED]', err);
      throw new Error(err.message || 'Failed to upload file to Supabase Storage.');
    }
  },
};
