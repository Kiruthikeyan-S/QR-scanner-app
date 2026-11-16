import { Platform } from 'react-native';
import {
  uploadAsync,
  FileSystemUploadType,
  cacheDirectory,
  copyAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import { getSupabaseConfig, getSupabaseClient } from '../lib/supabase';
import { UploadedFileMeta } from '../types/qr';

const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB (MP4, MOV)
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB (MP3, WAV, M4A)
const MAX_FILE_SIZE = 25 * 1024 * 1024;  // 25 MB (PDF and docs)

export interface FileClassification {
  folder: 'photos' | 'videos' | 'audio' | 'pdfs' | 'files';
  category: 'image' | 'video' | 'audio' | 'pdf' | 'spreadsheet' | 'document' | 'json' | 'text' | 'archive' | 'file';
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

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  sanitizeExt(filename: string, defaultExt = 'bin'): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';
      return ext || defaultExt;
    }
    return defaultExt;
  },

  classifyFile(filename: string, declaredType?: 'photo' | 'video' | 'audio' | 'file', rawMime?: string): FileClassification {
    const ext = this.sanitizeExt(filename);
    const mime = rawMime || '';

    // Videos -> qr-files/videos/
    if (
      declaredType === 'video' ||
      ['mp4', 'mov', 'm4v', 'webm', '3gp'].includes(ext) ||
      mime.startsWith('video/')
    ) {
      const resolvedMime = mime.startsWith('video/')
        ? mime
        : ext === 'mov'
        ? 'video/quicktime'
        : ext === 'webm'
        ? 'video/webm'
        : 'video/mp4';
      return {
        folder: 'videos',
        category: 'video',
        label: 'Video File',
        mimeType: resolvedMime,
      };
    }

    // Audio -> qr-files/audio/
    if (
      declaredType === 'audio' ||
      ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext) ||
      mime.startsWith('audio/')
    ) {
      const resolvedMime = mime.startsWith('audio/')
        ? mime
        : ext === 'wav'
        ? 'audio/wav'
        : ext === 'm4a'
        ? 'audio/m4a'
        : ext === 'aac'
        ? 'audio/aac'
        : ext === 'ogg'
        ? 'audio/ogg'
        : 'audio/mpeg';
      return {
        folder: 'audio',
        category: 'audio',
        label: 'Audio File',
        mimeType: resolvedMime,
      };
    }

    // Photos / Images -> qr-files/photos/
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

    // PDF Documents -> qr-files/pdfs/
    if (ext === 'pdf' || mime === 'application/pdf') {
      return {
        folder: 'pdfs',
        category: 'pdf',
        label: 'PDF Document',
        mimeType: 'application/pdf',
      };
    }

    // Excel Spreadsheets -> qr-files/files/
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

    // CSV Spreadsheets -> qr-files/files/
    if (ext === 'csv' || mime === 'text/csv') {
      return {
        folder: 'files',
        category: 'spreadsheet',
        label: 'CSV Spreadsheet',
        mimeType: 'text/csv',
      };
    }

    // Word Documents -> qr-files/files/
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

    // JSON Files -> qr-files/files/
    if (ext === 'json' || mime === 'application/json') {
      return {
        folder: 'files',
        category: 'json',
        label: 'JSON File',
        mimeType: 'application/json',
      };
    }

    // Text Files -> qr-files/files/
    if (['txt', 'text', 'md', 'log'].includes(ext) || mime.startsWith('text/plain')) {
      return {
        folder: 'files',
        category: 'text',
        label: 'Text File',
        mimeType: 'text/plain; charset=utf-8',
      };
    }

    // ZIP / Archives -> qr-files/files/
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return {
        folder: 'files',
        category: 'archive',
        label: 'ZIP Archive',
        mimeType: 'application/zip',
      };
    }

    // Generic Document -> qr-files/files/
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
   * saving to photos/, pdfs/, or files/ with UUID names.
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: 'photo' | 'video' | 'audio' | 'file' = 'photo',
    mimeType?: string,
    fileSize?: number,
    onProgress?: (progress: number, bytesSent?: number, totalBytes?: number) => void
  ): Promise<UploadedFileMeta> {
    const startTime = Date.now();
    const cleanFileName =
      fileName ||
      (fileType === 'photo'
        ? 'photo.jpg'
        : fileType === 'video'
        ? 'video.mp4'
        : fileType === 'audio'
        ? 'audio.mp3'
        : 'document.pdf');
    const classification = this.classifyFile(cleanFileName, fileType, mimeType);

    // 1. Validate File Size Boundaries
    let maxAllowed = MAX_FILE_SIZE;
    if (classification.category === 'image') maxAllowed = MAX_PHOTO_SIZE;
    else if (classification.category === 'video') maxAllowed = MAX_VIDEO_SIZE;
    else if (classification.category === 'audio') maxAllowed = MAX_AUDIO_SIZE;

    if (fileSize && fileSize > maxAllowed) {
      throw new Error(
        `File size (${this.formatBytes(fileSize)}) exceeds the ${this.formatBytes(maxAllowed)} limit for ${classification.label}.`
      );
    }

    // 2. Check Supabase Configuration
    const config = await getSupabaseConfig();
    if (!config.isConfigured) {
      throw new Error('File upload is currently unavailable. Please try again.');
    }

    const ext = this.sanitizeExt(cleanFileName, classification.category === 'image' ? 'jpg' : 'pdf');
    const uuid = this.generateUUID();
    
    // Strict Storage paths:
    // photos/<uuid>.<ext>
    // pdfs/<uuid>.pdf
    // files/<uuid>.<ext>
    const storagePath = `${classification.folder}/${uuid}.${ext}`;
    const bucket = 'qr-files';
    const supabaseUrl = config.url.replace(/\/+$/, '');
    const supabaseKey = config.key;

    // 7-day automatic expiration calculation
    const RETENTION_DAYS = 7;
    const expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    if (onProgress) onProgress(20, Math.round((fileSize || 1000) * 0.2), fileSize || 1000);

    // 3. Native Android / iOS Upload using direct binary stream
    if (Platform.OS !== 'web' && typeof uploadAsync === 'function') {
      let tempLocalUri: string | null = null;
      try {
        if (onProgress) onProgress(30, Math.round((fileSize || 1000) * 0.3), fileSize || 1000);

        // Ensure file is in a readable local cache file:// path (fixes Android content:// stream issues)
        if (fileUri.startsWith('content://') || !fileUri.startsWith('file://')) {
          const cacheFileName = `up_${Date.now()}_${uuid}.${ext}`;
          tempLocalUri = `${cacheDirectory}${cacheFileName}`;
          try {
            await copyAsync({ from: fileUri, to: tempLocalUri });
          } catch (copyErr) {
            console.warn('[SUPABASE CACHE COPY FAILED, using direct URI]', copyErr);
            tempLocalUri = null;
          }
        }

        const effectiveUri = tempLocalUri || fileUri;

        if (onProgress) onProgress(50, Math.round((fileSize || 1000) * 0.5), fileSize || 1000);

        let uploadSucceeded = false;
        let lastErrorText = '';

        // Method A: Signed Upload URL via Supabase (preferred binary pipeline)
        const client = await getSupabaseClient();
        if (client) {
          try {
            const { data: signedData, error: signErr } = await client.storage
              .from(bucket)
              .createSignedUploadUrl(storagePath);

            if (!signErr && signedData?.signedUrl) {
              const fullSignedUrl = signedData.signedUrl.startsWith('http')
                ? signedData.signedUrl
                : `${supabaseUrl}/storage/v1${signedData.signedUrl.startsWith('/') ? '' : '/'}${signedData.signedUrl}`;

              const putResponse = await uploadAsync(fullSignedUrl, effectiveUri, {
                httpMethod: 'PUT',
                uploadType: FileSystemUploadType.BINARY_CONTENT,
                headers: {
                  'Content-Type': classification.mimeType,
                },
              });

              if (putResponse.status >= 200 && putResponse.status < 300) {
                uploadSucceeded = true;
              } else {
                lastErrorText = `Signed PUT error: status ${putResponse.status}`;
              }
            }
          } catch (signMethodErr: any) {
            console.warn('[SIGNED UPLOAD ATTEMPT SKIPPED]', signMethodErr?.message);
          }
        }

        // Method B: Direct Supabase REST API POST (if Method A didn't succeed)
        if (!uploadSucceeded) {
          const restUploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;
          const postResponse = await uploadAsync(restUploadUrl, effectiveUri, {
            httpMethod: 'POST',
            uploadType: FileSystemUploadType.BINARY_CONTENT,
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': classification.mimeType,
              'x-upsert': 'false',
            },
          });

          if (postResponse.status >= 200 && postResponse.status < 300) {
            uploadSucceeded = true;
          } else {
            let detail = `Status ${postResponse.status}`;
            try {
              const b = JSON.parse(postResponse.body);
              detail = b.message || b.error || postResponse.body;
            } catch {}
            lastErrorText = detail;
          }
        }

        if (uploadSucceeded) {
          if (onProgress) onProgress(100, fileSize || 1000, fileSize || 1000);

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

          await this.recordUploadedFileMetadata({
            id: uuid,
            bucket,
            storagePath,
            originalName: cleanFileName,
            mimeType: classification.mimeType,
            fileSize: fileSize || 0,
            expiresAt,
          });

          const totalDuration = Date.now() - startTime;
          console.log(`[SUPABASE UPLOAD OK] Direct Native -> ${publicUrl} (${totalDuration}ms)`);

          return {
            token_id: uuid,
            file_id: uuid,
            original_name: cleanFileName,
            filename: `${uuid}.${ext}`,
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
            expires_at: expiresAt,
          };
        } else {
          throw new Error(lastErrorText || 'Upload to storage could not be completed.');
        }
      } catch (err: any) {
        console.error('[SUPABASE DIRECT UPLOAD FAILED]', err);
        const lowerMsg = (err.message || '').toLowerCase();
        if (
          lowerMsg.includes('failed to connect') ||
          lowerMsg.includes('timed out') ||
          lowerMsg.includes('network request failed')
        ) {
          throw new Error('Upload failed. Please check your internet connection.');
        }
        throw new Error(err.message || 'File upload failed. Please try again.');
      } finally {
        if (tempLocalUri) {
          try {
            await deleteAsync(tempLocalUri, { idempotent: true });
          } catch {}
        }
      }
    }

    // 4. Web Platform (Browser) using Blob fetch -> supabase.storage.upload
    try {
      if (onProgress) onProgress(40, Math.round((fileSize || 1000) * 0.4), fileSize || 1000);

      const res = await fetch(fileUri);
      const blob = await res.blob();

      if (onProgress) onProgress(70, Math.round((fileSize || 1000) * 0.7), fileSize || 1000);

      const client = await getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client could not be initialized.');
      }

      const { error } = await client.storage.from(bucket).upload(storagePath, blob, {
        contentType: classification.mimeType,
        upsert: false,
      });

      if (error) {
        const msg = error.message || '';
        const lower = msg.toLowerCase();
        if (
          lower.includes('row-level security') ||
          lower.includes('violates') ||
          lower.includes('policy')
        ) {
          throw new Error('Storage upload permission is not configured.');
        }
        if (lower.includes('bucket') || lower.includes('not found')) {
          throw new Error('Storage bucket or upload path is invalid.');
        }
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      if (onProgress) onProgress(100, fileSize || 1000, fileSize || 1000);

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

      // Register in uploaded_files metadata table with 7-day expires_at
      await this.recordUploadedFileMetadata({
        id: uuid,
        bucket,
        storagePath,
        originalName: cleanFileName,
        mimeType: classification.mimeType,
        fileSize: fileSize || blob.size || 0,
        expiresAt,
      });

      const totalDuration = Date.now() - startTime;
      console.log(`[SUPABASE UPLOAD OK] Direct Web -> ${publicUrl} (${totalDuration}ms, expires: ${expiresAt})`);

      return {
        token_id: uuid,
        file_id: uuid,
        original_name: cleanFileName,
        filename: `${uuid}.${ext}`,
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
        expires_at: expiresAt,
      };
    } catch (err: any) {
      console.error('[SUPABASE WEB UPLOAD FAILED]', err);
      const lowerMsg = (err.message || '').toLowerCase();
      if (
        lowerMsg.includes('network') ||
        lowerMsg.includes('connection') ||
        lowerMsg.includes('failed to fetch')
      ) {
        throw new Error('Upload failed. Check your internet connection.');
      }
      throw new Error(err.message || 'Storage upload permission is not configured.');
    }
  },

  /**
   * Records uploaded file metadata in `uploaded_files` table with expires_at.
   */
  async recordUploadedFileMetadata(params: {
    id: string;
    bucket: string;
    storagePath: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    expiresAt: string;
  }): Promise<void> {
    try {
      const client = await getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('uploaded_files').insert({
        id: params.id,
        storage_bucket: params.bucket,
        storage_path: params.storagePath,
        original_name: params.originalName,
        mime_type: params.mimeType,
        file_size: params.fileSize,
        created_at: new Date().toISOString(),
        expires_at: params.expiresAt,
        status: 'active',
      });

      if (error) {
        console.warn('[UPLOAD METADATA WARNING]', error.message);
      }
    } catch (e: any) {
      console.warn('[UPLOAD METADATA EXCEPTION]', e.message);
    }
  },

  /**
   * Safe file deletion using Supabase Storage API (`remove([storagePath])`)
   * and updating the metadata status to 'deleted'.
   * Never performs direct SQL delete on storage.objects.
   */
  async deleteFile(storagePath: string, bucket = 'qr-files'): Promise<boolean> {
    try {
      const client = await getSupabaseClient();
      if (!client) return false;

      // 1. Storage API remove call
      const { error: storageError } = await client.storage
        .from(bucket)
        .remove([storagePath]);

      if (storageError) {
        console.error('[STORAGE API DELETE ERROR]', storageError);
        return false;
      }

      // 2. Update metadata status
      try {
        await client
          .from('uploaded_files')
          .update({
            status: 'deleted',
            deleted_at: new Date().toISOString(),
          })
          .eq('storage_path', storagePath);
      } catch (dbErr) {
        console.warn('[METADATA UPDATE WARNING]', dbErr);
      }

      return true;
    } catch (e) {
      console.error('[STORAGE DELETE EXCEPTION]', e);
      return false;
    }
  },
};
