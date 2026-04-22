import api from './api';

export const downloadOrderInvoicePdf = (orderId) =>
  api.get(`/admin/billing/orders/${orderId}/invoice/pdf`, { responseType: 'blob' });

export const sendOrderInvoiceEmail = (orderId) => api.post(`/admin/billing/orders/${orderId}/invoice/email`);

export const createOrderCreditNote = (orderId, payload) =>
  api.post(`/admin/billing/orders/${orderId}/credit-note`, payload);

export const createAutomaticOrderCreditNote = (orderId, payload) =>
  api.post(`/admin/billing/orders/${orderId}/credit-note/automatic`, payload);

export const deleteOrderInvoice = (orderId, payload = {}) =>
  api.delete(`/admin/billing/orders/${orderId}/invoice`, { data: payload });
