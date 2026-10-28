import axios from 'axios';

const TOKEN_KEY = 'civicfix.token';

export const tokenStore = {
  get: () => {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) — the session stays in memory only */
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};

/**
 * In development `VITE_API_URL` is empty so requests go to `/api` and Vite
 * proxies them to the Express server. In production set VITE_API_URL.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let the browser set the multipart boundary itself.
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

/** Emitted when the server rejects our token so the UI can sign the user out. */
export const UNAUTHORIZED_EVENT = 'civicfix:unauthorized';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(normalizeError(error));
  },
);

/** Turns any axios failure into a predictable `{ message, code, details, status }`. */
function normalizeError(error) {
  if (error.response) {
    const { data, status } = error.response;
    return {
      message: data?.message || 'The request could not be completed.',
      code: data?.code || 'REQUEST_FAILED',
      details: data?.details || null,
      status,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: 'The request timed out. Please check your connection and try again.',
      code: 'TIMEOUT',
      details: null,
      status: 0,
    };
  }

  return {
    message:
      'Cannot reach the CivicFix API. Make sure the backend server is running on port 5000.',
    code: 'NETWORK_ERROR',
    details: null,
    status: 0,
  };
}

/** Resolves a `photo.url` (relative for local storage, absolute for Cloudinary). */
export const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
    : '';
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

export default api;
