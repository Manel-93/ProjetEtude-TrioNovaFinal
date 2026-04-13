import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { storage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { getApiError } from '../utils/errors';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      const profile = await login(email.trim(), password);
      if (profile?.role === 'ADMIN') {
        const access = storage.getAccess();
        const refresh = storage.getRefresh();
        if (!access || !refresh) {
          setError('Session invalide après connexion.');
          return;
        }
        const hash = new URLSearchParams({ access, refresh }).toString();
        storage.clearAuth();
        window.location.href = `${ADMIN_URL.replace(/\/$/, '')}/auth/handoff#${hash}`;
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-2xl font-bold text-white shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold text-ink">{t('auth.loginTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="card p-8">
          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.submitLogin')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/mot-de-passe-oublie" className="text-ocean hover:underline">
              {t('auth.forgot')}
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-600">
            <Link to="/inscription" className="font-medium text-ocean hover:underline">
              {t('auth.registerTitle')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
