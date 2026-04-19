import api from './api';

export const login = (email, password, twoFactorToken) =>
  api.post('/auth/login', { email, password, ...(twoFactorToken ? { twoFactorToken } : {}) });

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });

export const changePassword = (payload) =>
  api.patch('/auth/change-password', payload);
