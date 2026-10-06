import { SettingsStorage } from '../storage/settingsStorage';

export async function getBaseApiUrl(): Promise<string> {
  // Check env variable first, fallback to user-configured settings
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const settings = await SettingsStorage.get();
  return (settings.backendUrl || 'http://localhost:8000').replace(/\/$/, '');
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
