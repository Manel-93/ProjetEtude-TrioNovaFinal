import axios from 'axios';

const LS_ACCESS = 'althe_access_token';
const LS_REFRESH = 'althe_refresh_token';
const LS_GUEST = 'althe_guest_token';
const LS_REMEMBER = 'althe_remember_me';

export const storage = {
  getAccess: () => localStorage.getItem(LS_ACCESS) || sessionStorage.getItem(LS_ACCESS),
  setAccess: (t, remember = localStorage.getItem(LS_REMEMBER) === 'true') => {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    target.setItem(LS_ACCESS, t);
    other.removeItem(LS_ACCESS);
  },
  getRefresh: () => localStorage.getItem(LS_REFRESH) || sessionStorage.getItem(LS_REFRESH),
  setRefresh: (t, remember = localStorage.getItem(LS_REMEMBER) === 'true') => {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    target.setItem(LS_REFRESH, t);
    other.removeItem(LS_REFRESH);
  },
  getRemember: () => localStorage.getItem(LS_REMEMBER) === 'true',
  setRemember: (remember) => localStorage.setItem(LS_REMEMBER, String(Boolean(remember))),
  clearAuth: () => {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
    sessionStorage.removeItem(LS_ACCESS);
    sessionStorage.removeItem(LS_REFRESH);
  },
  getGuest: () => localStorage.getItem(LS_GUEST),
  setGuest: (t) => localStorage.setItem(LS_GUEST, t),
  clearGuest: () => localStorage.removeItem(LS_GUEST)
};

const api = axios.create({
  baseURL: '/api'
});

const refreshClient = axios.create({ baseURL: '/api' });

function decodeJwtPayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function captureGuestToken(res) {
  const h = res?.headers?.['x-guest-token'] || res?.headers?.['X-Guest-Token'];
  if (h) storage.setGuest(h);
}

let refreshInFlight = null;

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
  const token = storage.getAccess();
  const refreshToken = storage.getRefresh();
  const guest = storage.getGuest();
  const method = String(config?.method || 'GET').toUpperCase();

  if (method === 'GET') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
  }

  if (guest) {
    config.headers['X-Guest-Token'] = guest;
  }

  const isRefreshCall = String(config?.url || '').includes('/auth/refresh');
  if (!token || !refreshToken || isRefreshCall || config?.__skipAutoRefresh) {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  const payload = decodeJwtPayload(token);
  const expMs = payload?.exp ? payload.exp * 1000 : null;
  const now = Date.now();
  const shouldRefresh = typeof expMs === 'number' && expMs - now < 30 * 1000;

  if (shouldRefresh && !refreshInFlight) {
    refreshInFlight = refreshClient
      .post('/auth/refresh', { refreshToken })
      .then((res) => res.data)
      .finally(() => {});
  }

  if (shouldRefresh) {
    try {
      const refreshed = await refreshInFlight;
      refreshInFlight = null;
      const newAccessToken = refreshed?.data?.accessToken;
      if (newAccessToken) {
        storage.setAccess(newAccessToken);
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return config;
      }
    } catch {
      refreshInFlight = null;
    }
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    captureGuestToken(response);
    return response;
  },
  async (error) => {
    const res = error?.response;
    if (res) captureGuestToken(res);

    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status !== 401 || !originalRequest || originalRequest.__isRetry) {
      return Promise.reject(error);
    }

    const refreshToken = storage.getRefresh();
    if (!refreshToken) {
      storage.clearAuth();
      return Promise.reject(error);
    }

    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshClient.post('/auth/refresh', { refreshToken }).then((r) => r.data);
      }
      const refreshed = await refreshInFlight;
      refreshInFlight = null;
      const newAccessToken = refreshed?.data?.accessToken;
      if (newAccessToken) {
        storage.setAccess(newAccessToken);
        originalRequest.__isRetry = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api.request(originalRequest);
      }
    } catch (e) {
      refreshInFlight = null;
      storage.clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
