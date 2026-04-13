import api from './api';

export const getTopProductsAdmin = () => api.get('/admin/top-products');

export const addTopProduct = (productId) => api.post('/admin/top-products', { productId });

export const removeTopProduct = (productId) => api.delete(`/admin/top-products/${productId}`);

export const reorderTopProducts = (orderedProductIds) =>
  api.put('/admin/top-products/reorder', { orderedProductIds });

export const getTopProductsPublic = () => api.get('/products/home/top');
