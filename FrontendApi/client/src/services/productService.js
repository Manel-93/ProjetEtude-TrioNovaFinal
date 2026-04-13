import api from './api';

export const getProducts = (params = {}) => api.get('/products/admin/products', { params });
export const getProductById = (id) => api.get(`/products/admin/products/${id}`);
export const createProduct = (data) => api.post('/products/admin/products', data);
export const updateProduct = (id, data) => api.patch(`/products/admin/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/admin/products/${id}`);
// On charge par défaut les catégories actives en mode "plat" (sans hiérarchie)
export const getCategories = (params = {}) =>
  api.get('/products/admin/categories', {
    params: {
      status: 'active',
      hierarchy: false,
      ...params
    }
  });

export const getCategoryById = (id) => api.get(`/products/admin/categories/${id}`);
export const createCategory = (data) => api.post('/products/admin/categories', data);
export const updateCategory = (id, data) => api.patch(`/products/admin/categories/${id}`, data);
export const deleteCategory = (id) =>
  api.delete(`/products/admin/categories/${encodeURIComponent(Number(id))}`);
