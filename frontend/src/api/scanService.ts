import { apiFetch } from './client';
import { ScanRecord } from '../types/qr';

export const BackendScanService = {
  async getAll(): Promise<{ data: ScanRecord[] | null; error: string | null }> {
    return apiFetch<ScanRecord[]>('/api/v1/scans');
  },

  async create(scan: { id?: string; type: string; data: string; scanned_at?: string }): Promise<{ data: ScanRecord | null; error: string | null }> {
    return apiFetch<ScanRecord>('/api/v1/scans', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
  },

  async delete(id: string): Promise<{ data: any | null; error: string | null }> {
    return apiFetch<any>(`/api/v1/scans/${id}`, {
      method: 'DELETE',
    });
  },

  async clearAll(): Promise<{ data: any | null; error: string | null }> {
    return apiFetch<any>('/api/v1/scans', {
      method: 'DELETE',
    });
  },
};
