import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../services/users';
import { getApiError } from '../utils/errors';

export default function AccountProfilePage() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      await updateProfile(form);
      await refreshProfile();
      setMsg('OK');
    } catch (e2) {
      setErr(getApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t('account.profile')}</h1>
      <form onSubmit={submit} className="card mt-4 max-w-lg space-y-4 p-6">
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
        <div>
          <label className="text-sm font-medium">{t('auth.email')}</label>
          <input className="input mt-1 bg-slate-100" value={user?.email || ''} disabled />
        </div>
        <div>
          <label className="text-sm font-medium">{t('auth.firstName')}</label>
          <input
            className="input mt-1"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('auth.lastName')}</label>
          <input
            className="input mt-1"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('account.phone')}</label>
          <input
            className="input mt-1"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t('common.loading') : t('account.save')}
        </button>
      </form>
    </div>
  );
}
