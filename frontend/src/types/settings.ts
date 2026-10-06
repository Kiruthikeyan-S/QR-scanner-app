export interface UserSettings {
  vibration: boolean;
  sound: boolean;
  autoCopy: boolean;
  continuousScan: boolean;
  themeMode: 'system' | 'light' | 'dark';
  backendUrl: string;
  backendSyncEnabled: boolean;
}

export const defaultSettings: UserSettings = {
  vibration: true,
  sound: true,
  autoCopy: false,
  continuousScan: false,
  themeMode: 'light',
  backendUrl: 'http://localhost:8000',
  backendSyncEnabled: false,
};
