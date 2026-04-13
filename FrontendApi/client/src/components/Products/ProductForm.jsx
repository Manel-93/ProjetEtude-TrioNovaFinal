import { useMemo, useState } from 'react';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function ProductForm({ initialValues, onSubmit, submitLabel }) {
  const defaults = useMemo(
    () => ({
      name: '',
      description: '',
      technicalSpecs: {},
      priceHt: '',
      tva: 20,
      stock: 0,
      priority: 0,
      status: 'active',
      slug: '',
      categoryId: ''
    }),
    []
  );

  const [form, setForm] = useState({ ...defaults, ...initialValues });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const payload = {
        ...form,
        priceHt: Number(form.priceHt),
        tva: Number(form.tva),
        stock: Number(form.stock),
        priority: Number(form.priority),
        categoryId: form.categoryId === '' ? undefined : Number(form.categoryId)
      };
      await onSubmit(payload);
    } catch (err) {
      const message = err?.response?.data?.error?.message || 'Unable to save product.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-4 sm:p-6">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input className="input" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <div className="flex gap-2">
            <input className="input" value={form.slug} onChange={(e) => setField('slug', e.target.value)} required />
            <button type="button" className="btn-secondary" onClick={() => setField('slug', slugify(form.name))}>
              Auto
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select className="input" value={form.status} onChange={(e) => setField('status', e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="draft">draft</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Price HT</label>
          <input type="number" className="input" value={form.priceHt} onChange={(e) => setField('priceHt', e.target.value)} required min="0" step="0.01" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">TVA</label>
          <input type="number" className="input" value={form.tva} onChange={(e) => setField('tva', e.target.value)} min="0" max="100" step="0.01" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Stock</label>
          <input type="number" className="input" value={form.stock} onChange={(e) => setField('stock', e.target.value)} min="0" step="1" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Priority</label>
          <input type="number" className="input" value={form.priority} onChange={(e) => setField('priority', e.target.value)} step="1" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Category ID</label>
          <input type="number" className="input" value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)} min="1" step="1" />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}