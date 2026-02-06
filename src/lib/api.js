// src/lib/api.js
import axios from 'axios';
import { getBaseUrl, getToken, isTokenExpired, clearAuth } from './config';

let instance = createInstance(getBaseUrl());

function createInstance(baseURL) {
  const ax = axios.create({ baseURL, timeout: 15000 });

  // attach auth header
  ax.interceptors.request.use((config) => {
    const token = getToken();
    // proactively clear expired tokens before sending any request
    if (token && isTokenExpired(token)) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('axios:authError', {
            detail: { status: 401, message: 'Session expired' },
          }),
        );
      }
      // cancel this request with a uniform error shape
      const err = {
        status: 401,
        message: 'Session expired (client)',
        raw: null,
      };
      return Promise.reject(err);
    }
    // ensure headers object exists
    config.headers = { ...(config.headers || {}) };
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // default JSON; FormData will override automatically
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    config.headers.Accept = config.headers.Accept || 'application/json';
    return config;
  });

  // normalize errors  broadcast 401s for UI
  ax.interceptors.response.use(
    (r) => r,
    (error) => {
      const status = error?.response?.status ?? 0;
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Request failed';

      // if server says unauthorized, clear creds once
      if (status === 401) {
        clearAuth();
      }

      if (typeof window !== 'undefined' && status === 401) {
        window.dispatchEvent(
          new CustomEvent('axios:authError', { detail: { status, message } }),
        );
      }
      return Promise.reject({ status, message, raw: error });
    },
  );

  return ax;
}

// listen for settings changes (Settings page calls setBaseUrl/setToken)
if (typeof window !== 'undefined') {
  window.addEventListener('cfg:baseUrl', (e) => {
    instance = createInstance(e.detail);
  });
  // token change is picked up per-request; no need to recreate instance
  window.addEventListener('cfg:token', () => {});
}

// export a callable getter so you always use the latest instance
export default function api() {
  return instance;
}
