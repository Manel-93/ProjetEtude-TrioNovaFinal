import api from './api';

export const get2FAStatus = () => api.get('/admin/2fa/status');

export const generate2FASecret = () => api.post('/admin/2fa/generate');

export const enable2FA = (token) => api.post('/admin/2fa/enable', { token });

export const disable2FA = () => api.post('/admin/2fa/disable');

