import api from './api';

export const getContactMessages = (params = {}) => api.get('/admin/contact-messages', { params });
export const getContactMessageById = (id) => api.get(`/admin/contact-messages/${id}`);

