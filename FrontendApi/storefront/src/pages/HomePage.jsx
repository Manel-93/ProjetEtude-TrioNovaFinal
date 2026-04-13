import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProducts, fetchCategories } from '../services/products';
import { fetchHomeCarousel } from '../services/homeCarousel';
import { getPrimaryImageUrl } from '../utils/product';
import { getDefaultMedicalImageUrl, placeholderUrl } from '../utils/catalogFallbackImages';
import { getCategoryCoverImageUrl } from '../utils/categoryImage';
import { resolveMediaUrl } from '../utils/mediaUrl';
import ProductCard from '../components/ProductCard';
import { getProductDisplayName } from '../utils/productLocale';
import { getCategoryDisplayName, getCategoryDisplayDescription } from '../utils/categoryLocale';
import { getCarouselSlideTitle, getCarouselSlideSubtitle } from '../utils/carouselLocale';

function useCarouselIndex(length) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!length) return;
    const t = setInterval(() => setI((v) => (v + 1) % length), 6000);
    return () => clearInterval(t);
  }, [length]);

  useEffect(() => {
    if (length > 0 && i >= length) setI(0);
  }, [length, i]);

  return { i, setI };
}

export default function HomePage() {
  const { t, i18n } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      const res = await fetchProducts({ page: 1, limit: 120, status: 'active' });
      return res.data;
    }
  });

  const products = data?.data || [];

  const { data: carouselRaw } = useQuery({
    queryKey: ['home-carousel'],
    queryFn: async () => {
      const res = await fetchHomeCarousel();
      return res.data?.data || [];
    }
  });

  const apiSlides = Array.isArray(carouselRaw) ? carouselRaw : [];

  const productSlides = useMemo(
    () => (products || []).filter((p) => getPrimaryImageUrl(p)).slice(0, 8),
    [products]
  );

  const fromApi = apiSlides.length > 0;
  const slides = fromApi ? apiSlides : productSlides;
  const { i, setI } = useCarouselIndex(slides.length);

  const current = slides[i];

  const imageUrl = useMemo(() => {
    if (!current) return null;
    if (fromApi) return resolveMediaUrl(current.imageUrl);
    return getPrimaryImageUrl(current);
  }, [current, fromApi]);

  const lang = i18n?.language || 'fr';
  const title = current
    ? fromApi
      ? getCarouselSlideTitle(current, lang)
      : getProductDisplayName(current, lang)
    : '';
  const subtitle = current
    ? fromApi
      ? getCarouselSlideSubtitle(current, lang)
      : current.description || ''
    : '';

  const linkHref = useMemo(() => {
    if (!current) return '/';
    if (fromApi) {
      if (current.linkUrl) return current.linkUrl;
      if (current.slug) return `/produit/${encodeURIComponent(current.slug)}`;
      return '/';
    }
    return `/produit/${encodeURIComponent(current.slug)}`;
  }, [current, fromApi]);

  const isExternalLink = /^https?:\/\//i.test(linkHref);

  const { data: categoriesRaw, isLoading: catLoading } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const res = await fetchCategories();
      return res.data.data || [];
    }
  });

  const categories = useMemo(() => {
    const list = categoriesRaw || [];
    const sampleByCat = new Map();
    for (const p of products) {
      const cid = p.categoryId ?? p.category_id;
      if (cid && !sampleByCat.has(cid)) sampleByCat.set(cid, p);
    }
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      image: getCategoryCoverImageUrl(c, sampleByCat.get(c.id)) || null
    }));
  }, [categoriesRaw, products]);

  const topProducts = useMemo(() => products.slice(0, 8), [products]);
  const categoryFallback = getDefaultMedicalImageUrl();
  const categoryFinal = placeholderUrl('Medical Category', 600, 400);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        {t('common.error')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <section aria-label={t('home.carousel')} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {slides.length > 0 && imageUrl ? (
          <>
            <div className="relative aspect-[16/9] max-h-[420px] w-full bg-ink md:aspect-[21/9]">
              <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-10">
                <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
                {subtitle ? (
                  <p className="mt-2 line-clamp-2 max-w-xl text-sm text-slate-200">{subtitle}</p>
                ) : null}
                {isExternalLink ? (
                  <a
                    href={linkHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('common.continue')}
                  </a>
                ) : (
                  <Link
                    to={linkHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    {t('common.continue')}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2">
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-slate-100"
                onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-2 rounded-full ${idx === i ? 'w-6 bg-ocean' : 'w-2 bg-slate-300'}`}
                    onClick={() => setI(idx)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-slate-100"
                onClick={() => setI((v) => (v + 1) % slides.length)}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex aspect-[21/9] items-center justify-center bg-slate-100 text-slate-500">
            {t('home.noProducts')}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-ink">{t('home.categories')}</h2>
        {catLoading ? (
          <p className="text-slate-600">{t('common.loading')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((c) => {
              const catTitle = getCategoryDisplayName(c, lang);
              const catDesc = getCategoryDisplayDescription(c, lang);
              return (
                <Link
                  key={c.id}
                  to={`/catalogue/${c.id}`}
                  className="card overflow-hidden p-0 transition hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    <img
                      src={c.image || categoryFallback}
                      alt={catTitle || t('common.categoryFallback')}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const next = e.currentTarget.src.includes('source.unsplash.com')
                          ? categoryFallback
                          : categoryFinal;
                        if (e.currentTarget.src !== next) {
                          e.currentTarget.src = next;
                        }
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-ink">{catTitle}</h3>
                    {catDesc ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{catDesc}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-ink">{t('home.topProducts')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
