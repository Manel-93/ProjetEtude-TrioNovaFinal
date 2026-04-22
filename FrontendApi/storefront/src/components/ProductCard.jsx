import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPrimaryImageUrl, isInStock, getProductStockValue } from '../utils/product';
import { getDefaultMedicalImageUrl, placeholderUrl } from '../utils/catalogFallbackImages';
import { getProductDisplayName } from '../utils/productLocale';

export default function ProductCard({ product, listMode = false }) {
  const { t, i18n } = useTranslation();
  const title = getProductDisplayName(product, i18n?.language || 'fr');
  const img = getPrimaryImageUrl(product) || getDefaultMedicalImageUrl();
  const stockOk = isInStock(product);
  const stockValue = getProductStockValue(product);
  const outOfStock = stockValue != null && stockValue <= 0;
  const normalizedName = String(product?.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (import.meta.env.DEV && normalizedName.includes('gant') && normalizedName.includes('nitrile')) {
    console.warn('[STOCK-DEBUG][Catalog][ProductCard]', {
      id: product?.id,
      name: product?.name,
      stock: product?.stock,
      stockQuantity: product?.stockQuantity,
      quantity: product?.quantity,
      availableStock: product?.availableStock,
      inventoryStock: product?.inventory?.stock,
      stockOk
    });
  }

  const price = Number(product.priceTtc ?? product.price_ttc ?? 0).toFixed(2);
  const fallbackFinal = placeholderUrl('Medical Equipment', 600, 600);

  const inner = (
    <>
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-slate-100 ${
          listMode ? 'aspect-square w-28 sm:w-36' : 'aspect-square w-full max-md:w-28 max-md:shrink-0'
        }`}
      >
        <img
          src={img}
          alt={title || t('common.productFallback')}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const next = e.currentTarget.src.includes('source.unsplash.com')
              ? getDefaultMedicalImageUrl()
              : fallbackFinal;
            if (e.currentTarget.src !== next) {
              e.currentTarget.src = next;
            }
          }}
        />
        {outOfStock ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t('product.outOfStock')}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-lg font-bold text-ocean">{t('product.price', { value: price })}</p>
        <p className={`mt-1 text-xs ${outOfStock ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
          {outOfStock ? t('product.outOfStock') : t('product.stock')}
        </p>
      </div>
    </>
  );

  const layout = listMode
    ? 'flex flex-row gap-4 p-4'
    : 'flex flex-row gap-4 p-4 md:flex-col md:p-3';

  return (
    <Link
      to={`/produit/${encodeURIComponent(product.slug)}`}
      className={`card group block transition hover:shadow-md ${layout}`}
    >
      {inner}
    </Link>
  );
}
