import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductBySlug, fetchCategories } from '../services/products';
import { getDefaultMedicalImageUrl, placeholderUrl } from '../utils/catalogFallbackImages';
import { getCategoryCoverImageUrl } from '../utils/categoryImage';
import ProductCard from '../components/ProductCard';
import { getCategoryDisplayName, getCategoryDisplayDescription } from '../utils/categoryLocale';

function normalizeProductName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function isHiddenCatalogProduct(product) {
  const n = normalizeProductName(product?.name);
  if (!n) return false;

  if ((n.includes('gant') || n.includes('gants')) && n.includes('nitrile') && n.includes('poudr')) {
    return true;
  }
  if ((n.includes('gueridon') || n.includes('guerido')) && n.includes('inox')) return true;
  if (n.includes('otoscope') && n.includes('fibre') && n.includes('optique')) return true;

  return false;
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n?.language || 'fr';
  const id = parseInt(categoryId, 10);

  const { data: meta } = useQuery({
    queryKey: ['category-meta', id],
    enabled: Number.isFinite(id),
    queryFn: async () => {
      const res = await fetchProducts({ page: 1, limit: 1, categoryId: id, status: 'active' });
      const first = res.data.data?.[0];
      if (first) {
        const detail = await fetchProductBySlug(first.slug);
        return { category: detail.data.data?.category || null, sample: first };
      }
      const catRes = await fetchCategories();
      const cats = catRes.data.data || [];
      const category = cats.find((c) => Number(c.id) === id) || null;
      return { category, sample: null };
    }
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ['category-products', id],
    enabled: Number.isFinite(id),
    queryFn: async () => {
      const res = await fetchProducts({ page: 1, limit: 60, categoryId: id, status: 'active' });
      return res.data;
    }
  });

  const products = (list?.data || []).filter((p) => !isHiddenCatalogProduct(p));
  if (import.meta.env.DEV) {
    const nitrileProducts = (list?.data || []).filter((p) =>
      normalizeProductName(p?.name).includes('nitrile')
    );
    if (nitrileProducts.length > 0) {
      console.warn(
        '[STOCK-DEBUG][CategoryPage][nitrile-list]',
        nitrileProducts.map((p) => ({ id: p.id, name: p.name, stock: p.stock, slug: p.slug }))
      );
    }
  }
  const cat = meta?.category;
  const catTitle = cat ? getCategoryDisplayName(cat, lang) : '';
  const catDesc = cat ? getCategoryDisplayDescription(cat, lang) : '';
  const cover = getCategoryCoverImageUrl(cat, meta?.sample);
  const coverFallback = getDefaultMedicalImageUrl();
  const coverFinal = placeholderUrl('Medical Category', 1200, 675);

  if (!Number.isFinite(id)) {
    return <p className="text-red-600">{t('common.error')}</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="card overflow-hidden p-0 sm:flex">
        <div className="aspect-[16/9] w-full bg-slate-100 sm:max-w-md md:aspect-auto md:min-h-[220px]">
          <img
            src={cover || coverFallback}
            alt={catTitle || t('common.categoryFallback')}
            className="h-full w-full object-cover"
            onError={(e) => {
              const next = e.currentTarget.src.includes('source.unsplash.com')
                ? coverFallback
                : coverFinal;
              if (e.currentTarget.src !== next) {
                e.currentTarget.src = next;
              }
            }}
          />
        </div>
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ocean">{t('category.title')}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{catTitle || '—'}</h1>
          {catDesc ? <p className="mt-3 text-slate-600">{catDesc}</p> : null}
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-ocean hover:underline">
            ← {t('nav.home')}
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">{t('category.products')}</h2>
        {isLoading ? (
          <p className="text-slate-500">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-slate-500">{t('category.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
