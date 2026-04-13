import api from './api';

export const getOrders = (params = {}) => api.get('/orders/admin/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);

