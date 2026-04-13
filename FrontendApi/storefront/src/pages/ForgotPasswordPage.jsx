import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../services/auth';
import { getApiError } from '../utils/errors';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setMsg('Si un compte existe, un email de réinitialisation a été envoyé.');
    } catch (e2) {
      setErr(getApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-center text-2xl font-bold text-slate-900">{t('auth.forgot')}</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-8">
        {err ? <div className="text-sm text-red-600">{err}</div> : null}
        {msg ? <div className="text-sm text-green-700">{msg}</div> : null}
        <div>
          <label className="mb-1 block text-sm font-medium">{t('auth.email')}</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? t('common.loading') : t('contact.send')}
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
