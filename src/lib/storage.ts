/**
 * localStorage helpers.
 *
 * Every access is wrapped: localStorage throws in private browsing, when the
 * quota is full, and when a site's cookies are blocked. None of those should
 * take a screen down, so failures degrade to "no saved data" rather than
 * propagating.
 *
 * Reads must not happen during render — the server has no localStorage, so a
 * value read at render time would differ between server and client and break
 * hydration. Call these from effects or event handlers only.
 */

const PREFIX = "speak:";

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota or private mode. Losing a draft is bad; crashing is worse.
  }
}

export function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
