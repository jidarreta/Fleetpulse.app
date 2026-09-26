/** Browser storage helpers used for offline-friendly FleetPulse state. */
export interface PendingApiRequest {
  id: string;
  url: string;
  method: 'POST' | 'PATCH';
  body: string;
  requiresAuth: boolean;
  createdAt: string;
}

export function readLocalData<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    const parsed = JSON.parse(value) as T;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeLocalData<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
