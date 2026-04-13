import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register as registerApi } from '../services/auth';
import { getApiError } from '../utils/errors';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerApi(form);
      setDone(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card p-8">
          <p className="text-slate-700">
            Inscription réussie. Vérifiez votre boîte mail pour confirmer votre compte avant de vous connecter.
          </p>
          <button type="button" className="btn-primary mt-6" onClick={() => navigate('/connexion')}>
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-center text-2xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        <div>
          <label className="mb-1 block text-sm font-medium">{t('auth.firstName')}</label>
          <input
            className="input"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('auth.lastName')}</label>
          <input
            className="input"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('auth.email')}</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('auth.password')}</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? t('common.loading') : t('auth.submitRegister')}
        </button>
        <p className="text-center text-sm text-slate-600">
          <Link to="/connexion" className="text-ocean hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </form>
    </div>
  );
}
