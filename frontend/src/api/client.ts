import Constants from 'expo-constants';
import { SettingsStorage } from '../storage/settingsStorage';

export function getAutoDetectedHost(): string {
  // Try to find host IP from Expo Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }
  return 'http://localhost:8000';
}

export async function getBaseApiUrl(): Promise<string> {
  // Check env variable first
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  const settings = await SettingsStorage.get();
  // If user explicitly configured a non-localhost URL, use it
  if (settings.backendUrl && settings.backendUrl !== 'http://localhost:8000') {
    return settings.backendUrl.replace(/\/+$/, '');
  }

  // Auto-detect host machine IP for mobile Expo Go / physical device
  return getAutoDetectedHost();
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const baseUrl = await getBaseApiUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: `HTTP ${response.status}: ${errorText || response.statusText}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err.name === 'AbortError' ? 'Request timed out' : err.message || 'Network error',
    };
  }
}
