import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../services/auth';
import { getApiError } from '../utils/errors';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/connexion', { replace: true });
    } catch (e2) {
      setErr(getApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-center text-2xl font-bold text-slate-900">{t('auth.resetTitle')}</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-8">
        {err ? <div className="text-sm text-red-600">{err}</div> : null}
        {!token ? <div className="text-sm text-red-600">Token manquant dans l’URL.</div> : null}
        <div>
          <label className="mb-1 block text-sm font-medium">{t('auth.password')}</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={loading || !token}>
          {loading ? t('common.loading') : t('account.save')}
        </button>
        <p className="text-center text-sm">
          <Link to="/connexion" className="text-ocean hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </form>
    </div>
  );
}
