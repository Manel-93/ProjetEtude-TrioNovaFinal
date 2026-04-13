import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { validateCart, createPaymentIntent, finalizePaymentIntent } from '../services/cart';
import { createAddress } from '../services/users';
import { getApiError } from '../utils/errors';

const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

function PaymentForm({ onSuccess }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) {
      setErr(t('checkout.paymentNotReady'));
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErr(submitError.message);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/caisse/succes`
        },
        redirect: 'if_required'
      });

      if (error) {
        setErr(error.message);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        try {
          await finalizePaymentIntent(paymentIntent.id);
        } catch (e) {
          setErr(getApiError(e) || 'Finalisation impossible');
          return;
        }
        onSuccess();
        return;
      }

      if (paymentIntent?.status === 'processing') {
        setErr(t('checkout.paymentProcessing'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        onLoadError={(e) => setErr(e.error?.message || t('checkout.paymentLoadError'))}
      />
      {!stripe || !elements ? (
        <p className="text-xs text-slate-500">{t('checkout.paymentLoading')}</p>
      ) : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button
        type="button"
        className="btn-primary w-full py-3"
        onClick={pay}
        disabled={!stripe || !elements || busy}
      >
        {busy ? t('checkout.processing') : t('checkout.pay')}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [addr, setAddr] = useState({
    firstName: '',
    lastName: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: ''
  });
  const [addrErr, setAddrErr] = useState('');

  const intentMut = useMutation({
    mutationFn: async () => {
      await validateCart();
      const res = await createPaymentIntent();
      return res.data.data.clientSecret;
    },
    onSuccess: (secret) => {
      setClientSecret(secret);
      setStep(3);
    },
    onError: (e) => setAddrErr(getApiError(e))
  });

  useEffect(() => {
    if (user && step === 1) {
      setStep(2);
    }
  }, [user, step]);

  const saveShipping = async () => {
    setAddrErr('');
    if (!user) {
      intentMut.mutate();
      return;
    }
    const phoneTrim = addr.phone?.trim() || '';
    try {
      await createAddress({
        type: 'shipping',
        firstName: addr.firstName.trim(),
        lastName: addr.lastName.trim(),
        addressLine1: addr.addressLine1.trim(),
        city: addr.city.trim(),
        postalCode: addr.postalCode.trim(),
        country: addr.country.trim(),
        ...(phoneTrim ? { phone: phoneTrim } : {})
      });
      await refreshProfile();
      intentMut.mutate();
    } catch (e) {
      setAddrErr(getApiError(e));
    }
  };

  if (!pk) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-red-700">
        {t('checkout.stripeMissing')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{t('checkout.title')}</h1>

      <ol className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
        <li className={step >= 1 ? 'text-ocean' : ''}>1. {t('checkout.stepAuth')}</li>
        <li>→</li>
        <li className={step >= 2 ? 'text-ocean' : ''}>2. {t('checkout.stepAddress')}</li>
        <li>→</li>
        <li className={step >= 3 ? 'text-ocean' : ''}>3. {t('checkout.stepPayment')}</li>
      </ol>

      {step === 1 && (
        <div className="card space-y-4 p-6">
          <p className="text-slate-700">{t('checkout.loginPrompt')}</p>
          <Link to="/connexion" className="btn-primary block w-full py-3 text-center">
            {t('nav.login')}
          </Link>
          <Link to="/inscription" className="btn-secondary block w-full py-3 text-center">
            {t('checkout.registerPrompt')}
          </Link>
          <button type="button" className="w-full py-2 text-sm text-ocean hover:underline" onClick={() => setStep(2)}>
            {t('checkout.guest')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-3 p-6">
          <h2 className="font-semibold text-slate-900">{t('checkout.stepAddress')}</h2>
          {addrErr ? <p className="text-sm text-red-600">{addrErr}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">{t('auth.firstName')}</label>
              <input className="input" value={addr.firstName} onChange={(e) => setAddr((a) => ({ ...a, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">{t('auth.lastName')}</label>
              <input className="input" value={addr.lastName} onChange={(e) => setAddr((a) => ({ ...a, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Adresse</label>
            <input className="input" value={addr.addressLine1} onChange={(e) => setAddr((a) => ({ ...a, addressLine1: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Ville</label>
              <input className="input" value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Code postal</label>
              <input className="input" value={addr.postalCode} onChange={(e) => setAddr((a) => ({ ...a, postalCode: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Pays</label>
            <input className="input" value={addr.country} onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">{t('account.phone')}</label>
            <input className="input" value={addr.phone} onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))} />
          </div>
          <button type="button" className="btn-primary w-full py-3" onClick={saveShipping} disabled={intentMut.isPending}>
            {intentMut.isPending ? t('common.loading') : t('common.continue')}
          </button>
          {!user ? (
            <p className="text-xs text-slate-500">
              En tant qu’invité, l’adresse sert à la livraison affichée localement ; la commande utilisera les données du paiement côté serveur.
            </p>
          ) : null}
        </div>
      )}

      {step === 3 && clientSecret ? (
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">{t('checkout.stepPayment')}</h2>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' }
            }}
          >
            <PaymentForm
              onSuccess={async () => {
                qc.invalidateQueries({ queryKey: ['cart'] });
                qc.invalidateQueries({ queryKey: ['payment-methods'] });
                await refreshProfile?.();
                navigate('/caisse/succes');
              }}
            />
          </Elements>
        </div>
      ) : null}

      {step === 3 && intentMut.isPending ? <p>{t('common.loading')}</p> : null}
    </div>
  );
}
