import api from '../api/client';

export function fetchProducts(params = {}) {
  return api.get('/products', {
    params: { status: 'active', ...params }
  });
}

export function fetchCategories() {
  return api.get('/products/categories');
}

export function fetchProductBySlug(slug) {
  return api.get(`/products/${encodeURIComponent(slug)}`);
}
