import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedQRRecord, QRType } from '../types/qr';
import { STORAGE_KEYS } from './storageKeys';

export const SavedQRStorage = {
  async getAll(): Promise<SavedQRRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_QRS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to load saved QRs from storage', e);
      return [];
    }
  },

  async getById(id: string): Promise<SavedQRRecord | null> {
    const list = await this.getAll();
    return list.find((item) => item.id === id) || null;
  },

  async add(record: { name: string; type: QRType; data: string; id?: string }): Promise<SavedQRRecord> {
    try {
      const list = await this.getAll();
      const now = new Date().toISOString();
      const newRecord: SavedQRRecord = {
        id: record.id || Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        name: record.name,
        type: record.type,
        data: record.data,
        created_at: now,
        updated_at: now,
      };

      const updated = [newRecord, ...list];
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_QRS, JSON.stringify(updated));
      return newRecord;
    } catch (e) {
      console.warn('Failed to save QR to storage', e);
      const now = new Date().toISOString();
      return {
        id: Date.now().toString(),
        name: record.name,
        type: record.type,
        data: record.data,
        created_at: now,
        updated_at: now,
      };
    }
  },

  async update(id: string, updates: Partial<Pick<SavedQRRecord, 'name' | 'data' | 'type'>>): Promise<SavedQRRecord | null> {
    try {
      const list = await this.getAll();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return null;

      const updatedRecord: SavedQRRecord = {
        ...list[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      list[index] = updatedRecord;
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_QRS, JSON.stringify(list));
      return updatedRecord;
    } catch (e) {
      console.warn('Failed to update saved QR', e);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const list = await this.getAll();
      const updated = list.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_QRS, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.warn('Failed to delete saved QR', e);
      return false;
    }
  },
};
