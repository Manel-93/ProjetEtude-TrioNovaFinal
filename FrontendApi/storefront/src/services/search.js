import api from '../api/client';
import { fetchProducts } from './products';

export async function searchProducts(params) {
  try {
    const res = await api.get('/products/search', {
      params: { ...params, sortBy: params.sortBy || 'priority' }
    });
    return { source: 'elasticsearch', ...res.data };
  } catch (err) {
    const status = err?.response?.status;
    if (status === 503 || status === 500) {
      const q = params.q || '';
      const res = await fetchProducts({
        page: params.page || 1,
        limit: Math.min(100, (params.limit || 20) * 3),
        search: q.trim() || undefined,
        categoryId: params.categoryId || undefined,
        inStock: params.inStock,
        status: 'active'
      });
      let rows = res.data.data || [];
      if (params.minPrice != null) {
        rows = rows.filter((p) => Number(p.priceTtc) >= Number(params.minPrice));
      }
      if (params.maxPrice != null) {
        rows = rows.filter((p) => Number(p.priceTtc) <= Number(params.maxPrice));
      }
      const limit = params.limit || 20;
      const page = params.page || 1;
      const start = (page - 1) * limit;
      const paged = rows.slice(start, start + limit);
      return {
        source: 'mysql',
        success: true,
        data: paged,
        pagination: {
          page,
          limit,
          total: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / limit))
        }
      };
    }
    throw err;
  }
}
