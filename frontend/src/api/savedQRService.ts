import { apiFetch } from './client';
import { SavedQRRecord } from '../types/qr';

export const BackendSavedQRService = {
  async getAll(): Promise<{ data: SavedQRRecord[] | null; error: string | null }> {
    return apiFetch<SavedQRRecord[]>('/api/v1/qr/saved');
  },

  async create(qr: { id?: string; name: string; type: string; data: string }): Promise<{ data: SavedQRRecord | null; error: string | null }> {
    return apiFetch<SavedQRRecord>('/api/v1/qr/saved', {
      method: 'POST',
      body: JSON.stringify(qr),
    });
  },

  async update(id: string, updates: { name?: string; type?: string; data?: string }): Promise<{ data: SavedQRRecord | null; error: string | null }> {
    return apiFetch<SavedQRRecord>(`/api/v1/qr/saved/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<{ data: any | null; error: string | null }> {
    return apiFetch<any>(`/api/v1/qr/saved/${id}`, {
      method: 'DELETE',
    });
  },
};
