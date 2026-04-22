import api from '../api/client';

export const getProfile = () => api.get('/users/me');

export const updateProfile = (body) => api.patch('/users/me', body);

export const getAddresses = () => api.get('/users/me/addresses');

export const createAddress = (body) => api.post('/users/me/addresses', body);

export const updateAddress = (id, body) => api.patch(`/users/me/addresses/${id}`, body);

export const deleteAddress = (id) => api.delete(`/users/me/addresses/${id}`);

export const setDefaultAddress = (id) => api.patch(`/users/me/addresses/${id}/default`);

export const getPaymentMethods = () => api.get('/users/me/payment-methods');

export const createPaymentMethod = (body) => api.post('/users/me/payment-methods', body);

export const deletePaymentMethod = (id) => api.delete(`/users/me/payment-methods/${id}`);

export const setDefaultPaymentMethod = (id) =>
  api.patch(`/users/me/payment-methods/${id}/default`);

export const getMyCredits = (params = {}) => api.get('/users/me/credits', { params });

export const downloadMyCreditPdf = (id) =>
  api.get(`/users/me/credits/${id}/pdf`, { responseType: 'blob' });
