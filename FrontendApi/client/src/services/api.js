import axios from 'axios';
import { redirectToStorefrontLogin } from '../utils/storefrontUrl';

const api = axios.create({
  baseURL: '/api'
});

const refreshClient = axios.create({
  baseURL: '/api'
});

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

let refreshInFlight = null;

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem('admin_access_token');
  const refreshToken = localStorage.getItem('admin_refresh_token');
  const method = String(config?.method || 'GET').toUpperCase();

  // Evite les réponses 304 (donc un body vide) sur les listes admin.
  if (method === 'GET') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }

  // Ne jamais essayer de refresh pendant la requête de refresh elle-même
  const isRefreshCall = String(config?.url || '').includes('/auth/refresh');
  if (!token || !refreshToken || isRefreshCall || config?.__skipAutoRefresh) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  // Pré-refrech : on évite les 401 en rafraîchissant quelques secondes avant expiration
  const payload = decodeJwtPayload(token);
  const expMs = payload?.exp ? payload.exp * 1000 : null;
  const now = Date.now();
  const shouldRefresh = typeof expMs === 'number' && expMs - now < 30 * 1000;

  if (shouldRefresh && !refreshInFlight) {
    refreshInFlight = refreshClient
      .post('/auth/refresh', { refreshToken })
      .then((res) => res.data)
      .finally(() => {
        // on remettra refreshInFlight à null après récupération effective
      });
  }

  if (shouldRefresh) {
    try {
      const refreshed = await refreshInFlight;
      refreshInFlight = null;
      const newAccessToken =
        refreshed?.data?.accessToken || refreshed?.accessToken || refreshed?.data?.access_token || null;
      if (newAccessToken) {
        localStorage.setItem('admin_access_token', newAccessToken);
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return config;
      }
    } catch {
      // fallback : la réponse 401 sera gérée par l'intercepteur response
      refreshInFlight = null;
    }
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status !== 401 || !originalRequest || originalRequest.__isRetry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      redirectToStorefrontLogin();
      return Promise.reject(error);
    }

    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshClient
          .post('/auth/refresh', { refreshToken })
          .then((res) => res.data);
      }
      const refreshed = await refreshInFlight;
      refreshInFlight = null;

      const newAccessToken =
        refreshed?.data?.accessToken || refreshed?.accessToken || refreshed?.data?.access_token || null;

      if (newAccessToken) {
        localStorage.setItem('admin_access_token', newAccessToken);
        originalRequest.__isRetry = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api.request(originalRequest);
      }

      // Si pas de nouveau token, on force logout
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      redirectToStorefrontLogin();
      return Promise.reject(error);
    } catch (refreshErr) {
      refreshInFlight = null;
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      redirectToStorefrontLogin();
      return Promise.reject(refreshErr);
    }
  }
);

export default api;