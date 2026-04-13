import api from './api';

export const getMe = () => api.get('/users/me');
export const updateMe = (payload) => api.patch('/users/me', payload);
export const deleteMe = () => api.delete('/users/me');

export const getMyAddresses = (type = null) =>
  api.get('/users/me/addresses', {
    params: type ? { type } : undefined
  });

export const createAddress = (payload) => api.post('/users/me/addresses', payload);
export const updateAddress = (id, payload) => api.patch(`/users/me/addresses/${id}`, payload);
export const setDefaultAddress = (id) => api.patch(`/users/me/addresses/${id}/default`);
export const deleteAddress = (id) => api.delete(`/users/me/addresses/${id}`);

export const getPaymentMethods = () => api.get('/users/me/payment-methods');
export const createPaymentMethod = (payload) => api.post('/users/me/payment-methods', payload);
export const setDefaultPaymentMethod = (id) => api.patch(`/users/me/payment-methods/${id}/default`);
export const deletePaymentMethod = (id) => api.delete(`/users/me/payment-methods/${id}`);

