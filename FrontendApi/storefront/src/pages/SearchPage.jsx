import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '../services/search';
import { fetchProducts, fetchProductBySlug } from '../services/products';
import ProductCard from '../components/ProductCard';
import { getCategoryDisplayName } from '../utils/categoryLocale';

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n?.language || 'fr';
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const categoryId = params.get('categoryId') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const inStock = params.get('inStock') || '';
  const sortBy = params.get('sortBy') || 'priority';
  const page = parseInt(params.get('page') || '1', 10);

  const queryPayload = useMemo(
    () => ({
      q,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true' ? 'true' : inStock === 'false' ? 'false' : undefined,
      sortBy,
      page,
      limit: 20
    }),
    [q, categoryId, minPrice, maxPrice, inStock, sortBy, page]
  );

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['search', queryPayload],
    queryFn: () => searchProducts(queryPayload),
    placeholderData: (prev) => prev
  });

  const { data: catOptions } = useQuery({
    queryKey: ['search-category-options'],
    queryFn: async () => {
      const res = await fetchProducts({ page: 1, limit: 80, status: 'active' });
      const products = res.data.data || [];
      const map = new Map();
      for (const p of products) {
        if (p.categoryId && !map.has(p.categoryId)) map.set(p.categoryId, p.slug);
      }
      const opts = await Promise.all(
        [...map.entries()].slice(0, 20).map(async ([cid, slug]) => {
          try {
            const r = await fetchProductBySlug(slug);
            const cat = r.data.data?.category;
            return cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null;
          } catch {
            return null;
          }
        })
      );
      return opts.filter(Boolean);
    }
  });

  const items = data?.data || [];
  const pagination = data?.pagination;

  const setField = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, String(value));
    next.set('page', '1');
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('search.title')}</h1>

      <div className="card grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('search.query')}</label>
          <input
            className="input"
            defaultValue={q}
            onBlur={(e) => setField('q', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setField('q', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('search.category')}</label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => setField('categoryId', e.target.value)}
          >
            <option value="">—</option>
            {(catOptions || []).map((c) => (
              <option key={c.id} value={c.id}>
                {getCategoryDisplayName(c, lang)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('search.minPrice')}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            defaultValue={minPrice}
            onBlur={(e) => setField('minPrice', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('search.maxPrice')}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            defaultValue={maxPrice}
            onBlur={(e) => setField('maxPrice', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('search.availability')}</label>
          <select
            className="input"
            value={inStock}
            onChange={(e) => setField('inStock', e.target.value)}
          >
            <option value="">—</option>
            <option value="true">{t('search.inStockOnly')}</option>
            <option value="false">{t('product.outOfStock')}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('search.sort')}</label>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setField('sortBy', e.target.value)}
          >
            <option value="priority">{t('search.sortPriority')}</option>
            <option value="price_asc">{t('search.sortPriceAsc')}</option>
            <option value="price_desc">{t('search.sortPriceDesc')}</option>
            <option value="newest">{t('search.sortNewest')}</option>
            <option value="stock">{t('search.sortStock')}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500">{t('common.loading')}</p>
      ) : error ? (
        <p className="text-red-600">{t('common.error')}</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            {t('search.results', { count: pagination?.total ?? items.length })}
            {isFetching ? ` (${t('common.loading')})` : ''}
          </p>
          {items.length === 0 ? (
            <p className="text-slate-500">{t('search.noResults')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                className="btn-secondary"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('page', String(page - 1));
                  setParams(next);
                }}
              >
                ←
              </button>
              <span className="px-3 py-2 text-sm text-slate-600">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                className="btn-secondary"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('page', String(page + 1));
                  setParams(next);
                }}
              >
                →
              </button>
            </div>
          ) : null}
        </>
      )}

      <p className="text-xs text-slate-400">
        {data?.source === 'mysql' ? 'Recherche via le catalogue (Elasticsearch indisponible).' : null}
      </p>
    </div>
  );
}
