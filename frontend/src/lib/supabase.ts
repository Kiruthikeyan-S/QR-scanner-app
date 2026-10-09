import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/config';

export const DEFAULT_SUPABASE_BUCKET = CONFIG.SUPABASE_BUCKET || 'qr-files';

export interface SupabaseConfig {
  url: string;
  key: string;
  bucket: string;
  isConfigured: boolean;
}

export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  const url = CONFIG.SUPABASE_URL.trim();
  const key = CONFIG.SUPABASE_PUBLISHABLE_KEY.trim();

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
  const url = CONFIG.SUPABASE_URL.trim();
  const key = CONFIG.SUPABASE_PUBLISHABLE_KEY.trim();

  return Boolean(
    url &&
    key &&
    !url.includes('YOUR_PROJECT') &&
    !url.includes('your-project') &&
    url.startsWith('https://')
  );
};
