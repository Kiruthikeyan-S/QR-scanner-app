import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanRecord, QRType } from '../types/qr';
import { STORAGE_KEYS } from './storageKeys';

export const HistoryStorage = {
  async getAll(): Promise<ScanRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to load history from storage', e);
      return [];
    }
  },

  async add(record: Omit<ScanRecord, 'id' | 'scanned_at'> & { id?: string; scanned_at?: string }): Promise<ScanRecord> {
    try {
      const history = await this.getAll();
      const newRecord: ScanRecord = {
        id: record.id || Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        type: record.type,
        data: record.data,
        scanned_at: record.scanned_at || new Date().toISOString(),
      };

      // Add to front of history and deduplicate recent adjacent if identical within 5s
      const updated = [newRecord, ...history];
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      return newRecord;
    } catch (e) {
      console.warn('Failed to save scan record to storage', e);
      return {
        id: Date.now().toString(),
        type: record.type,
        data: record.data,
        scanned_at: new Date().toISOString(),
      };
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const history = await this.getAll();
      const updated = history.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.warn('Failed to delete item from history', e);
      return false;
    }
  },

  async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
      return true;
    } catch (e) {
      console.warn('Failed to clear history', e);
      return false;
    }
  },
};
