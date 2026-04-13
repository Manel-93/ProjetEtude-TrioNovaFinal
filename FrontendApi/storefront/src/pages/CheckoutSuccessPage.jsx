import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { finalizePaymentIntent } from '../services/cart';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutSuccessPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const redirectStatus = params.get('redirect_status');
  const paymentIntentId = params.get('payment_intent');
  const [finalizeState, setFinalizeState] = useState('idle'); // idle | pending | done | error

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!paymentIntentId) return;
      setFinalizeState('pending');
      try {
        await finalizePaymentIntent(paymentIntentId);
        if (!cancelled) setFinalizeState('done');
      } catch {
        if (!cancelled) setFinalizeState('error');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [paymentIntentId, qc, refreshProfile]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="card space-y-4 p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('checkout.success')}</h1>
        <p className="text-slate-600">{t('checkout.successHint')}</p>
        {finalizeState === 'pending' ? (
          <p className="text-xs text-slate-400">Finalisation de la commande…</p>
        ) : null}
        {finalizeState === 'error' ? (
          <p className="text-xs text-amber-700">
            Paiement reçu, mais la finalisation de commande a échoué. Recharge la page ou contacte le support.
          </p>
        ) : null}
        {redirectStatus ? (
          <p className="text-xs text-slate-400">Statut Stripe : {redirectStatus}</p>
        ) : null}
        <Link to="/" className="btn-primary inline-block px-6 py-3">
          {t('nav.home')}
        </Link>
        <Link to="/compte/commandes" className="block text-sm text-ocean hover:underline">
          {t('account.orders')}
        </Link>
      </div>
    </div>
  );
}
