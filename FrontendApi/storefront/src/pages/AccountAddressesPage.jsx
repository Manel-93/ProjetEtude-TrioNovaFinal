import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../services/users';
import { getApiError } from '../utils/errors';

const emptyForm = {
  type: 'shipping',
  firstName: '',
  lastName: '',
  addressLine1: '',
  city: '',
  postalCode: '',
  country: 'France',
  phone: ''
};

export default function AccountAddressesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [err, setErr] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await getAddresses();
      return res.data.data;
    }
  });

  const createMut = useMutation({
    mutationFn: () => createAddress(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      setErr('');
      setForm(emptyForm);
    },
    onError: (e) => setErr(getApiError(e))
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => updateAddress(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      setErr('');
      setEditingId(null);
      setEditForm(emptyForm);
    },
    onError: (e) => setErr(getApiError(e))
  });

  const delMut = useMutation({
    mutationFn: (id) => deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] })
  });

  const defMut = useMutation({
    mutationFn: (id) => setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] })
  });

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditForm({
      type: a.type,
      firstName: a.firstName || '',
      lastName: a.lastName || '',
      addressLine1: a.addressLine1 || '',
      city: a.city || '',
      postalCode: a.postalCode || '',
      country: a.country || 'France',
      phone: a.phone || ''
    });
    setErr('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setErr('');
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editingId) return;
    setErr('');
    updateMut.mutate({
      id: editingId,
      body: {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        addressLine1: editForm.addressLine1,
        city: editForm.city,
        postalCode: editForm.postalCode,
        country: editForm.country,
        phone: editForm.phone || undefined
      }
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t('account.addresses')}</h1>
      {isLoading ? <p className="mt-4">{t('common.loading')}</p> : null}
      <ul className="mt-4 space-y-3">
        {(data || []).map((a) => (
          <li key={a.id} className="card flex flex-col gap-4 p-4">
            {editingId === a.id ? (
              <form className="space-y-3" onSubmit={submitEdit}>
                <h3 className="font-semibold text-slate-900">Mettre à jour l&apos;adresse</h3>
                {err ? <p className="text-sm text-red-600">{err}</p> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Prénom"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                    minLength={2}
                  />
                  <input
                    className="input"
                    placeholder="Nom"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                    minLength={2}
                  />
                </div>
                <input
                  className="input"
                  placeholder="Adresse"
                  value={editForm.addressLine1}
                  onChange={(e) => setEditForm((f) => ({ ...f, addressLine1: e.target.value }))}
                  required
                  minLength={5}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="input"
                    placeholder="Ville"
                    value={editForm.city}
                    onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                    required
                    minLength={2}
                  />
                  <input
                    className="input"
                    placeholder="CP"
                    value={editForm.postalCode}
                    onChange={(e) => setEditForm((f) => ({ ...f, postalCode: e.target.value }))}
                    required
                  />
                </div>
                <input
                  className="input"
                  placeholder="Pays"
                  value={editForm.country}
                  onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                  required
                  minLength={2}
                />
                <input
                  className="input"
                  placeholder="Téléphone (optionnel)"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn-primary" disabled={updateMut.isPending}>
                    {updateMut.isPending ? t('common.loading') : t('account.save')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {a.firstName} {a.lastName} · {a.type}
                    </p>
                    <p className="text-sm text-slate-600">
                      {a.addressLine1}, {a.postalCode} {a.city}, {a.country}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary text-xs" onClick={() => startEdit(a)}>
                      Modifier
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => defMut.mutate(a.id)}>
                      Défaut
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => delMut.mutate(a.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Ajouter</h2>
      <form
        className="card mt-2 max-w-lg space-y-3 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setErr('');
          createMut.mutate();
        }}
      >
        {err && !editingId ? <p className="text-sm text-red-600">{err}</p> : null}
        <select
          className="input"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="shipping">Livraison</option>
          <option value="billing">Facturation</option>
        </select>
        <input
          className="input"
          placeholder="Prénom"
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Nom"
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Adresse"
          value={form.addressLine1}
          onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            placeholder="Ville"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="CP"
            value={form.postalCode}
            onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
            required
          />
        </div>
        <input
          className="input"
          placeholder="Pays"
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Téléphone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <button type="submit" className="btn-primary" disabled={createMut.isPending}>
          {t('account.save')}
        </button>
      </form>
    </div>
  );
}
