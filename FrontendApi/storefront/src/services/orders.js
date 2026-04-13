import api from '../api/client';

export const getOrders = (params) => api.get('/orders', { params });

export const getOrder = (id) => api.get(`/orders/${id}`);

export const downloadInvoicePdf = (invoiceId) =>
  api.get(`/orders/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
