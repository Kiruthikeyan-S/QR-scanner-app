import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { SettingsStorage } from '../storage/settingsStorage';

export function getAutoDetectedHost(): string {
  // 1. Check EXPO_PUBLIC_API_URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 2. Extract host from React Native SourceCode.scriptURL (Works in Android & iOS dev builds)
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL && typeof scriptURL === 'string') {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return `http://${match[1]}:8000`;
    }
  }

  // 3. Extract host from Expo constants
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).experienceUrl;

  if (hostUri && typeof hostUri === 'string') {
    const match = hostUri.match(/^https?:\/\/([^:/]+)/) || hostUri.match(/^([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return `http://${match[1]}:8000`;
    }
  }

  // 4. Default fallback on native Android & iOS mobile devices
  if (Platform.OS !== 'web') {
    return 'http://192.168.88.4:8000';
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
  // If user explicitly configured a custom (non-localhost) URL, use it
  if (
    settings.backendUrl &&
    settings.backendUrl !== 'http://localhost:8000' &&
    settings.backendUrl !== 'http://127.0.0.1:8000'
  ) {
    return settings.backendUrl.replace(/\/+$/, '');
  }

  // On physical mobile device / dev build, auto-resolve to host PC Wi-Fi IP
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
