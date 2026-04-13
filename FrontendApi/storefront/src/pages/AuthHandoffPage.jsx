import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function AuthHandoffPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const params = new URLSearchParams(hash);
      const access = params.get('access');
      const refresh = params.get('refresh');
      if (!access || !refresh) {
        setErr('Session invalide. Connectez-vous depuis la boutique.');
        return;
      }
      storage.setAccess(access);
      storage.setRefresh(refresh);
      window.history.replaceState(null, '', '/auth/transfert');
      try {
        await refreshProfile();
        if (!cancelled) navigate('/', { replace: true });
      } catch {
        if (!cancelled) setErr('Impossible de finaliser la connexion.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      {err ? (
        <p className="max-w-md text-sm text-red-600">{err}</p>
      ) : (
        <p className="text-slate-600">{t('common.loading')}</p>
      )}
    </div>
  );
}
