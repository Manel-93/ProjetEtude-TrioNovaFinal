import api from './api';

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });

export const changePassword = (payload) =>
  api.patch('/auth/change-password', payload);
