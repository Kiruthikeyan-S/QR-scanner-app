import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { CONFIG } from '../config/config';
import { SettingsStorage } from '../storage/settingsStorage';

export function getAutoDetectedHost(): string {
  // 1. Primary Public Production Backend from central config
  if (CONFIG.API_BASE_URL && CONFIG.API_BASE_URL.startsWith('https://')) {
    return CONFIG.API_BASE_URL.replace(/\/+$/, '');
  }

  // 2. Extract host from React Native SourceCode.scriptURL (Works in Android & iOS dev builds)
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL && typeof scriptURL === 'string') {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return `http://${match[1]}:8000`;
    }
  }

  // 3. Extract host from Expo constants (development only)
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

  return CONFIG.API_BASE_URL.replace(/\/+$/, '');
}

export async function getAllCandidateBaseUrls(): Promise<string[]> {
  const settings = await SettingsStorage.get();
  if (
    settings.backendUrl &&
    !settings.backendUrl.includes('localhost') &&
    !settings.backendUrl.includes('127.0.0.1')
  ) {
    return [settings.backendUrl.replace(/\/+$/, '')];
  }

  const primary = (CONFIG.API_BASE_URL || '').replace(/\/+$/, '');
  const autoHost = getAutoDetectedHost();

  const list = [primary, autoHost].filter(
    (v, i, a) => v && v.trim().length > 0 && a.indexOf(v) === i
  );

  return list;
}

let cachedReachableUrl: string | null = null;
let lastCheckTime = 0;

export async function getFastestReachableBaseUrl(): Promise<string> {
  const now = Date.now();
  if (cachedReachableUrl && now - lastCheckTime < 30000) {
    return cachedReachableUrl;
  }

  const candidates = await getAllCandidateBaseUrls();

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        cachedReachableUrl = url;
        lastCheckTime = Date.now();
        return url;
      }
    } catch {
      // Fallback
    }
  }

  const fallback = candidates[0] || CONFIG.API_BASE_URL.replace(/\/+$/, '');
  cachedReachableUrl = fallback;
  lastCheckTime = Date.now();
  return fallback;
}

export async function getBaseApiUrl(): Promise<string> {
  return getFastestReachableBaseUrl();
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
