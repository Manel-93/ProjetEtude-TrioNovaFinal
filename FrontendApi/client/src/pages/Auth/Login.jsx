import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/userSettingsService';

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3001').replace(/\/$/, '');

function mapProfileForUi(profile) {
  if (!profile) return null;
  return {
    ...profile,
    firstName: profile.first_name ?? profile.firstName,
    lastName: profile.last_name ?? profile.lastName
  };
}

function getApiMessage(err) {
  return err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Invalid credentials. Please try again.';
}

export default function Login() {
  const { login, setUserData } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, twoFactorToken.trim() || undefined);
      const meRes = await getMe();
      const profile = meRes.data.data;
      const role = profile?.role;

      if (role === 'ADMIN') {
        setUserData(mapProfileForUi(profile));
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Utilisateur → boutique : le localStorage n'est pas partagé entre ports (3000 / 3001),
      // on passe les jetons dans le hash (non envoyé au serveur).
      const accessToken = localStorage.getItem('admin_access_token');
      const refreshToken = localStorage.getItem('admin_refresh_token');
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      const enc = (s) => encodeURIComponent(s || '');
      window.location.assign(
        `${STOREFRONT_URL}/auth/transfert#access=${enc(accessToken)}&refresh=${enc(refreshToken)}`
      );
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white text-2xl font-bold shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AltheSystems</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connexion unique — administrateur ou espace client
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="twoFactorToken" className="mb-1.5 block text-sm font-medium text-slate-700">
                Code 2FA (si activé)
              </label>
              <input
                id="twoFactorToken"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input"
                placeholder="123456"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
