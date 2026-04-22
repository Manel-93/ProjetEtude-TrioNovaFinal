import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchProductBySlug } from '../services/products';
import { addToCart } from '../services/cart';
import { getApiError } from '../utils/errors';
import { isInStock, buildProductGalleryImages, getPrimaryImageUrl, getProductStockValue } from '../utils/product';
import ProductCard from '../components/ProductCard';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { getProductDisplayDescription, getProductDisplayName } from '../utils/productLocale';
import { getCategoryDisplayName } from '../utils/categoryLocale';

export default function ProductPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [imgIdx, setImgIdx] = useState(0);
  const [msg, setMsg] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await fetchProductBySlug(slug);
      return res.data.data;
    }
  });

  const categoryId = data?.categoryId ?? data?.category?.id;

  const { data: similarData } = useQuery({
    queryKey: ['similar', categoryId, data?.id],
    enabled: !!categoryId && !!data?.id,
    queryFn: async () => {
      const res = await fetchProducts({
        page: 1,
        limit: 12,
        categoryId,
        status: 'active'
      });
      return res.data.data.filter((p) => p.slug !== data.slug);
    }
  });

  const addMut = useMutation({
    mutationFn: (qty) => addToCart(data.id, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      setMsg('');
    },
    onError: (e) => setMsg(getApiError(e))
  });

  if (isLoading) {
    return <p className="text-center text-slate-500">{t('common.loading')}</p>;
  }
  if (error || !data) {
    return <p className="text-center text-red-600">{t('common.error')}</p>;
  }

  const images = buildProductGalleryImages(data);
  const main = images[imgIdx] || images[0];
  const mainUrl = main?.url ? resolveMediaUrl(main.url) : getPrimaryImageUrl(data);
  const stockOk = isInStock(data);
  const stockValue = getProductStockValue(data);
  const outOfStock = stockValue != null && stockValue <= 0;
  const specs = data.technicalSpecs && typeof data.technicalSpecs === 'object' ? data.technicalSpecs : null;
  const displayName = getProductDisplayName(data, i18n?.language || 'fr');

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {mainUrl ? (
              <img src={mainUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">—</div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((im, i) => (
                <button
                  key={im.id || i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    i === imgIdx ? 'border-ocean' : 'border-transparent'
                  }`}
                >
                  <img src={resolveMediaUrl(im.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-ink md:text-3xl">{displayName}</h1>
          <p className="mt-4 text-3xl font-bold text-ocean">
            {t('product.price', { value: Number(data.priceTtc).toFixed(2) })}
          </p>
          <p className={`mt-2 text-sm font-medium ${outOfStock ? 'text-red-600' : 'text-slate-600'}`}>
            {outOfStock ? t('product.outOfStock') : t('product.stock')}
          </p>
          {data.category ? (
            <Link
              to={`/catalogue/${data.category.id}`}
              className="mt-2 inline-block text-sm text-ocean hover:underline"
            >
              {getCategoryDisplayName(data.category, i18n?.language || 'fr')}
            </Link>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!stockOk || addMut.isPending}
              onClick={() => addMut.mutate(1)}
              className="btn-primary px-6 py-3 disabled:opacity-50"
            >
              {stockOk ? t('product.addToCart') : t('product.unavailable')}
            </button>
          </div>
          {msg ? <p className="mt-3 text-sm text-red-600">{msg}</p> : null}

          <div className="prose prose-slate mt-8 max-w-none">
            <p className="whitespace-pre-wrap text-slate-700">
              {getProductDisplayDescription(data, i18n?.language || 'fr')}
            </p>
          </div>

          {specs && Object.keys(specs).length > 0 ? (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">{t('product.specs')}</h2>
              <dl className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-2 px-4 py-2 text-sm">
                    <dt className="font-medium text-slate-600">{k}</dt>
                    <dd className="col-span-2 text-slate-900">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      {similarData?.length ? (
        <section>
          <h2 className="mb-4 text-xl font-bold">{t('product.similar')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarData.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
