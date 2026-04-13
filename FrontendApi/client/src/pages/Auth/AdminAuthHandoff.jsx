import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/userSettingsService';

/**
 * Mise en cache module : en dev, React.StrictMode monte/démonte deux fois.
 * Le premier passage lit le hash et appelle replaceState (hash vidé) ;
 * sans ce cache, le second passage ne voit plus les jetons.
 */
let handoffTokensCache = null;
/** Évite deux appels parallèles à getMe (ex. double effet StrictMode). */
let adminHandoffRequestStarted = false;

function consumeTokensFromHashOnce() {
  if (handoffTokensCache) {
    return handoffTokensCache;
  }
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const params = new URLSearchParams(hash);
  const access = params.get('access');
  const refresh = params.get('refresh');
  if (access && refresh) {
    handoffTokensCache = { access, refresh };
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
  return handoffTokensCache;
}

function clearHandoffCache() {
  handoffTokensCache = null;
}

function normalizeAdminUser(raw) {
  if (!raw) return null;
  return {
    ...raw,
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    email: raw.email ?? ''
  };
}

export default function AdminAuthHandoff() {
  const navigate = useNavigate();
  const { setUserData } = useAuth();
  const [err, setErr] = useState('');

  useEffect(() => {
    const tokens = consumeTokensFromHashOnce();
    if (!tokens?.access || !tokens?.refresh) {
      setErr('Session invalide. Connectez-vous depuis la boutique (Connexion).');
      return;
    }

    if (adminHandoffRequestStarted) {
      return;
    }
    adminHandoffRequestStarted = true;

    let cancelled = false;
    (async () => {
      localStorage.setItem('admin_access_token', tokens.access);
      localStorage.setItem('admin_refresh_token', tokens.refresh);
      try {
        const res = await getMe();
        const raw = res?.data?.data;
        const userData = normalizeAdminUser(raw);
        if (userData) {
          clearHandoffCache();
          setUserData(userData);
          navigate('/admin/dashboard', { replace: true });
        } else {
          clearHandoffCache();
          if (!cancelled) setErr('Profil introuvable.');
        }
      } catch {
        clearHandoffCache();
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        if (!cancelled) {
          setErr('Impossible de finaliser la connexion au panneau admin.');
        }
      } finally {
        adminHandoffRequestStarted = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, setUserData]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      {err ? (
        <p className="max-w-md text-sm text-red-600">{err}</p>
      ) : (
        <p className="text-sm text-slate-600">Ouverture du panneau d’administration…</p>
      )}
    </div>
  );
}
