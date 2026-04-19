import api from '../api/client';

export const login = (email, password, guestToken) =>
  api.post('/auth/login', { email, password, ...(guestToken ? { guestToken } : {}) });

export const register = (payload) => api.post('/auth/register', payload);

export const confirmEmail = (token) => api.post('/auth/confirm-email', { token });

export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword });
