// src/lib/config.js
const LS_KEYS = {
  baseUrl: 'baseUrl',
  token: 'token',
};

export function getBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:8080'; // SSR-safe default
  return localStorage.getItem(LS_KEYS.baseUrl) || 'http://localhost:8080';
}
// export function getBaseUrl() {
//   if (typeof window === 'undefined') return 'http://35.207.255.116:8080/'; // SSR-safe default
//   return localStorage.getItem(LS_KEYS.baseUrl) || 'http://35.207.255.116:8080/';
// }
// export function getBaseUrl() {
//   if (typeof window === 'undefined') return 'https://api.subhajitmondal.com/'; // SSR-safe default
//   return (
//     localStorage.getItem(LS_KEYS.baseUrl) || 'https://api.subhajitmondal.com/'
//   );
// }

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
