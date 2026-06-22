// Local JWT cache.
//
// InsForge's SDK keeps the session inside its private TokenManager —
// `client.auth.getSession()` is not part of the public API. To send the
// bearer token on serverFn RPCs we mirror the access token (and a few
// display fields) here. Clearing this on sign-out matches the SDK state.

const STORAGE_KEY = "insforge.auth.session.v1";

export type CachedAuthSession = {
  accessToken: string;
  userId: string;
  email?: string | null;
};

export function cacheAuthSession(session: CachedAuthSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn("[insforge] failed to cache session", err);
  }
}

export function loadCachedAuthSession(): CachedAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuthSession;
    if (!parsed?.accessToken || !parsed?.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCachedAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}