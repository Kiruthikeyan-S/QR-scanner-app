import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, defaultSettings } from '../types/settings';
import { STORAGE_KEYS } from './storageKeys';

export const SettingsStorage = {
  async get(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
      return defaultSettings;
    }
  },

  async save(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const current = await this.get();
      const updated: UserSettings = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to save settings to storage', e);
      return defaultSettings;
    }
  },
};
