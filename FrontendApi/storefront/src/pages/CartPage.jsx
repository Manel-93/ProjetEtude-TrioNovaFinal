import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCart, removeFromCart, updateCartItem } from '../services/cart';
import { getApiError } from '../utils/errors';
import { isInStock, getPrimaryImageUrl } from '../utils/product';
import { getDefaultMedicalImageUrl, placeholderUrl } from '../utils/catalogFallbackImages';
import { getProductDisplayName } from '../utils/productLocale';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await getCart();
      return res.data.data;
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ productId, quantity }) => updateCartItem(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => {}
  });

  const removeMut = useMutation({
    mutationFn: (productId) => removeFromCart(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] })
  });

  if (isLoading) {
    return <p className="text-center text-slate-500">{t('common.loading')}</p>;
  }
  if (error) {
    return <p className="text-center text-red-600">{getApiError(error)}</p>;
  }

  const items = data?.items || [];
  const unavailable = items.filter((i) => !isInStock(i.product));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('cart.title')}</h1>

      {items.length === 0 ? (
        <p className="text-slate-600">{t('cart.empty')}</p>
      ) : (
        <>
          {unavailable.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t('cart.stockIssue')} :{' '}
              {unavailable.map((i) => getProductDisplayName(i.product, i18n?.language || 'fr')).join(', ')}
            </div>
          ) : null}

          <ul className="space-y-4">
            {items.map((line) => {
              const p = line.product;
              const ok = isInStock(p);
              const img = getPrimaryImageUrl({ ...p, images: p.images || [] });
              const lineTitle = getProductDisplayName(p, i18n?.language || 'fr');
              const fallbackImg = placeholderUrl(lineTitle || 'Product', 200, 200);
              return (
                <li key={line.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const next = e.currentTarget.src.includes('source.unsplash.com')
                            ? getDefaultMedicalImageUrl()
                            : fallbackImg;
                          if (e.currentTarget.src !== next) {
                            e.currentTarget.src = next;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/produit/${p.slug}`} className="font-semibold text-slate-900 hover:text-ocean">
                      {lineTitle}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {t('product.price', { value: Number(p.priceTtc).toFixed(2) })}
                    </p>
                    {!ok ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{t('cart.unavailableLine')}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                      {t('cart.qty')}
                    </label>
                    <input
                      id={`qty-${line.productId}`}
                      type="number"
                      min={1}
                      disabled={!ok || updateMut.isPending}
                      className="input w-20 py-1 text-center"
                      defaultValue={line.quantity}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (n >= 1 && n !== line.quantity) {
                          updateMut.mutate({ productId: line.productId, quantity: n });
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => removeMut.mutate(line.productId)}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="card space-y-2 p-4">
            <div className="flex justify-between text-sm">
              <span>{t('cart.subtotal')}</span>
              <span>{Number(data.subtotal).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('cart.vat')}</span>
              <span>{Number(data.tva).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
              <span>{t('cart.total')}</span>
              <span>{Number(data.total).toFixed(2)} €</span>
            </div>
          </div>

          <Link to="/caisse" className="btn-primary block w-full py-3 text-center">
            {t('cart.checkout')}
          </Link>
        </>
      )}
    </div>
  );
}
