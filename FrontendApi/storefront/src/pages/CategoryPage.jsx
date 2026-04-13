import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductBySlug, fetchCategories } from '../services/products';
import { getDefaultMedicalImageUrl, placeholderUrl } from '../utils/catalogFallbackImages';
import { getCategoryCoverImageUrl } from '../utils/categoryImage';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { t } = useTranslation();
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

  const products = list?.data || [];
  const cat = meta?.category;
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
            alt={cat?.name || 'Catégorie médicale'}
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
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{cat?.name || '—'}</h1>
          {cat?.description ? <p className="mt-3 text-slate-600">{cat.description}</p> : null}
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
