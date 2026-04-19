import api from './api';

export const getOrders = (params = {}) => api.get('/orders/admin/orders', { params });
export const getOrderById = (id) => api.get(`/orders/admin/orders/${id}`);
export const updateOrderStatus = (id, payload) => api.post(`/orders/admin/orders/${id}/status`, payload);

