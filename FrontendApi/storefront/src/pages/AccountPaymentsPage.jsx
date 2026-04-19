import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod
} from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import { getApiError } from '../utils/errors';

function normalizeMethods(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.paymentMethods)) return raw.paymentMethods;
  return [];
}

export default function AccountPaymentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const [newCard, setNewCard] = useState({
    brand: '',
    last4: '',
    expiryMonth: '',
    expiryYear: ''
  });
  const [createError, setCreateError] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await getPaymentMethods();
      return res.data.data;
    }
  });

  const delMut = useMutation({
    mutationFn: (id) => deletePaymentMethod(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['payment-methods'] });
      await refreshProfile?.();
    }
  });

  const createMut = useMutation({
    mutationFn: (payload) => createPaymentMethod(payload),
    onSuccess: async () => {
      setCreateError('');
      setNewCard({ brand: '', last4: '', expiryMonth: '', expiryYear: '' });
      await qc.invalidateQueries({ queryKey: ['payment-methods'] });
      await refreshProfile?.();
    },
    onError: (err) => {
      setCreateError(getApiError(err));
    }
  });

  const defMut = useMutation({
    mutationFn: (id) => setDefaultPaymentMethod(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['payment-methods'] });
      await refreshProfile?.();
    }
  });

  const methods = useMemo(() => {
    const fromEndpoint = normalizeMethods(data);
    if (fromEndpoint.length > 0) return fromEndpoint;
    return normalizeMethods(user?.paymentMethods);
  }, [data, user?.paymentMethods]);

  const formatLine = (pm) => {
    const brand = (pm.brand || t('accountPayments.cardFallback')).toString();
    const last = pm.last4 ? `·••• ${pm.last4}` : t('accountPayments.maskedDigits');
    const exp =
      pm.expiryMonth && pm.expiryYear
        ? `${String(pm.expiryMonth).padStart(2, '0')}/${String(pm.expiryYear).slice(-2)}`
        : null;
    return { brand, last, exp };
  };

  const submitNewCard = (e) => {
    e.preventDefault();
    setCreateError('');
    const payload = {
      type: 'card',
      brand: newCard.brand.trim() || 'Carte',
      last4: newCard.last4.trim(),
      expiryMonth: newCard.expiryMonth ? Number(newCard.expiryMonth) : undefined,
      expiryYear: newCard.expiryYear ? Number(newCard.expiryYear) : undefined
    };
    if (!/^\d{4}$/.test(payload.last4)) {
      setCreateError(t('accountPayments.last4Invalid'));
      return;
    }
    createMut.mutate(payload);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t('account.payments')}</h1>

      {isError ? (
        <div className="card mt-4 space-y-2 p-4 text-sm text-red-700">
          <p>{t('accountPayments.fetchError')}</p>
          <p className="text-xs opacity-80">{getApiError(error)}</p>
          <button type="button" className="btn-secondary text-xs" onClick={() => refetch()}>
            {t('common.retry')}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="mt-4">{t('common.loading')}</p> : null}

      <ul className="mt-4 space-y-3">
        {methods.map((pm) => {
          const { brand, last, exp } = formatLine(pm);
          return (
            <li key={pm.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">
                  {brand} {last}
                  {pm.isDefault ? (
                    <span className="ml-2 rounded-md bg-ocean/10 px-2 py-0.5 text-xs font-semibold text-ocean">
                      {t('accountPayments.defaultBadge')}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {pm.type || 'card'}
                  {exp ? ` · ${t('accountPayments.expires', { value: exp })}` : null}
                </p>
              </div>
              <div className="flex gap-2">
                {!pm.isDefault ? (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => defMut.mutate(pm.id)}
                    disabled={defMut.isPending}
                  >
                    {t('accountPayments.setDefault')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => delMut.mutate(pm.id)}
                  disabled={delMut.isPending}
                >
                  {t('accountPayments.delete')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="card mt-5 p-4">
        <h2 className="text-base font-semibold text-slate-900">{t('accountPayments.addTitle')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('accountPayments.addDescription')}</p>
        <form onSubmit={submitNewCard} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            <span className="mb-1 block">{t('accountPayments.brandLabel')}</span>
            <input
              className="input"
              value={newCard.brand}
              onChange={(e) => setNewCard((prev) => ({ ...prev, brand: e.target.value }))}
              placeholder="Visa"
            />
          </label>
          <label className="text-sm text-slate-700">
            <span className="mb-1 block">{t('accountPayments.last4Label')}</span>
            <input
              className="input"
              inputMode="numeric"
              maxLength={4}
              value={newCard.last4}
              onChange={(e) =>
                setNewCard((prev) => ({ ...prev, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))
              }
              placeholder="4242"
              required
            />
          </label>
          <label className="text-sm text-slate-700">
            <span className="mb-1 block">{t('accountPayments.expiryMonthLabel')}</span>
            <input
              className="input"
              type="number"
              min="1"
              max="12"
              value={newCard.expiryMonth}
              onChange={(e) => setNewCard((prev) => ({ ...prev, expiryMonth: e.target.value }))}
              placeholder="12"
            />
          </label>
          <label className="text-sm text-slate-700">
            <span className="mb-1 block">{t('accountPayments.expiryYearLabel')}</span>
            <input
              className="input"
              type="number"
              min={new Date().getFullYear()}
              value={newCard.expiryYear}
              onChange={(e) => setNewCard((prev) => ({ ...prev, expiryYear: e.target.value }))}
              placeholder={String(new Date().getFullYear() + 2)}
            />
          </label>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={createMut.isPending}>
              {createMut.isPending ? t('common.loading') : t('accountPayments.addButton')}
            </button>
            {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
          </div>
        </form>
      </section>

      {methods.length === 0 && !isLoading ? (
        <div className="card mt-4 space-y-3 p-4 text-sm">
          <p className="font-medium text-slate-900">{t('accountPayments.emptyTitle')}</p>
          <p className="text-slate-600">{t('accountPayments.emptyDescription')}</p>
          <p className="text-xs text-slate-500">{t('accountPayments.emptyHint')}</p>
          <Link to="/caisse" className="inline-block text-sm font-medium text-ocean hover:underline">
            {t('cart.checkout')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
