// src/lib/config.js
const LS_KEYS = {
  baseUrl: 'baseUrl',
  token: 'token',
};

/**
 * VITE_API_BASE is baked into the bundle at build time — works fine in dist.
 * At runtime (dist) there is no .env, so we fall back to:
 *   1. localStorage (user-configured via Settings page)
 *   2. Hardcoded production URL
 */
const BAKED_BASE =
  typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_API_BASE || import.meta.env?.VITE_BACKEND_URL
    : null;

const PRODUCTION_FALLBACK = 'https://api.subhajitmondal.com';

export function getBaseUrl() {
  // 1. Env var baked in at build time
  const baked = BAKED_BASE && BAKED_BASE.trim();
  if (baked) return baked.replace(/\/$/, '');
  // 2. User-overridden via Settings page (persisted in localStorage)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LS_KEYS.baseUrl);
    if (stored) return stored.replace(/\/$/, '');
  }
  // 3. Hardcoded production fallback (safe for dist builds without .env)
  return PRODUCTION_FALLBACK;
}

export function setBaseUrl(url) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEYS.baseUrl, url);
  window.dispatchEvent(new CustomEvent('cfg:baseUrl', { detail: url }));
}

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LS_KEYS.token);
}

export function setToken(t) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEYS.token, t);
  window.dispatchEvent(new CustomEvent('cfg:token', { detail: t }));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(LS_KEYS.user);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored user', e);
    return null;
  }
}

// --- auth helpers ---
export function clearAuth() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LS_KEYS.token);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(LS_KEYS.user);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('auth:cleared'));
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewSeconds = 30) {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - skewSeconds <= now;
}
export const LS = LS_KEYS;
