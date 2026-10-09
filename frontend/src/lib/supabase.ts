import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsStorage } from '../storage/settingsStorage';

export const DEFAULT_SUPABASE_BUCKET = (
  process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'qr-files'
).trim();

export interface SupabaseConfig {
  url: string;
  key: string;
  bucket: string;
  isConfigured: boolean;
}

export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  const settings = await SettingsStorage.get();
  const url = (
    settings.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const key = (
    settings.supabaseKey ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('YOUR_PROJECT') &&
    !url.includes('your-project') &&
    url.startsWith('https://')
  );

  return {
    url,
    key,
    bucket: DEFAULT_SUPABASE_BUCKET,
    isConfigured,
  };
}

let clientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  const config = await getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (clientInstance && currentClientUrl === config.url && currentClientKey === config.key) {
    return clientInstance;
  }

  clientInstance = createClient(config.url, config.key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  currentClientUrl = config.url;
  currentClientKey = config.key;
  return clientInstance;
}

export const isSupabaseConfigured = (): boolean => {
  const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  return Boolean(
    url &&
    key &&
    !url.includes('YOUR_PROJECT') &&
    !url.includes('your-project') &&
    url.startsWith('https://')
  );
};
