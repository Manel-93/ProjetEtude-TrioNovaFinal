import { useMemo, useState } from 'react';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toSpecsArray(technicalSpecs) {
  if (!technicalSpecs || typeof technicalSpecs !== 'object') {
    return [{ key: '', value: '' }];
  }
  const entries = Object.entries(technicalSpecs);
  if (entries.length === 0) return [{ key: '', value: '' }];
  return entries.map(([key, value]) => ({ key, value: String(value) }));
}

function toImageArray(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return [{ url: '', alt: '', order: 0 }];
  }
  return images.map((img, index) => ({
    url: img.url || '',
    alt: img.alt || '',
    order: Number(img.order ?? index)
  }));
}

export default function ProductForm({
  initialValues,
  categories,
  submitLabel,
  onSubmit,
  onCancel,
  externalLoading = false,
  externalSuccess = '',
  externalError = ''
}) {
  const defaults = useMemo(
    () => ({
      name: '',
      description: '',
      categoryId: '',
      priceHt: '',
      tva: 20,
      stock: '',
      slug: '',
      technicalSpecs: {},
      images: []
    }),
    []
  );

  const [form, setForm] = useState({ ...defaults, ...initialValues });
  const [specRows, setSpecRows] = useState(toSpecsArray(initialValues?.technicalSpecs));
  const [imageRows, setImageRows] = useState(toImageArray(initialValues?.images));
  const [errors, setErrors] = useState({});
  const [localBusy, setLocalBusy] = useState(false);

  const busy = externalLoading || localBusy;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const setSpecField = (index, field, value) => {
    setSpecRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const setImageField = (index, field, value) => {
    setImageRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const validate = () => {
    const next = {};
    if (!String(form.name).trim()) next.name = 'Le nom est requis.';
    if (!String(form.description).trim()) {
      next.description = 'La description est requise.';
    } else if (String(form.description).trim().length < 10) {
      next.description = 'La description doit contenir au moins 10 caractères.';
    }
    if (!String(form.categoryId).trim()) next.categoryId = 'La catégorie est requise.';
    if (!String(form.priceHt).trim()) next.priceHt = 'Le prix est requis.';
    if (Number(form.priceHt) <= 0) next.priceHt = 'Le prix HT doit être strictement positif.';
    if (Number(form.tva) < 0 || Number(form.tva) > 100) next.tva = 'La TVA doit être comprise entre 0 et 100.';
    if (!String(form.stock).trim()) next.stock = 'Le stock est requis.';
    if (Number(form.stock) < 0) next.stock = 'Le stock ne peut pas être négatif.';

    imageRows.forEach((img, index) => {
      if ((img.alt || img.order) && !String(img.url).trim()) {
        next[`image_${index}`] = "L'URL d'image est requise quand les autres champs image sont renseignés.";
      }
    });

    return next;
  };

  const computedPriceTtc = useMemo(() => {
    const ht = Number(form.priceHt || 0);
    const tva = Number(form.tva || 0);
    if (!Number.isFinite(ht) || !Number.isFinite(tva)) return 0;
    return ht * (1 + tva / 100);
  }, [form.priceHt, form.tva]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const technicalSpecs = specRows.reduce((acc, row) => {
      const key = String(row.key || '').trim();
      const value = String(row.value || '').trim();
      if (key && value) acc[key] = value;
      return acc;
    }, {});

    const images = imageRows
      .map((img, index) => ({
        url: String(img.url || '').trim(),
        alt: String(img.alt || '').trim(),
        order: Number(img.order ?? index)
      }))
      .filter((img) => img.url);

    const payload = {
      name: String(form.name).trim(),
      description: String(form.description).trim(),
      categoryId: Number(form.categoryId),
      priceHt: Number(form.priceHt),
      tva: Number(form.tva),
      stock: Number(form.stock),
      slug: String(form.slug || slugify(form.name) || `produit-${Date.now()}`).trim(),
      technicalSpecs,
      images
    };

    setLocalBusy(true);
    try {
      await onSubmit(payload);
    } finally {
      setLocalBusy(false);
    }
  };

  const fieldError = (name) => (errors[name] ? <p className="mt-1 text-xs text-red-600">{errors[name]}</p> : null);

  return (
    <form onSubmit={handleSubmit} className="card mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
      {externalError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{externalError}</p> : null}
      {externalSuccess ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{externalSuccess}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Nom *</label>
          <input className="input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
          {fieldError('name')}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          {fieldError('description')}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie *</label>
          <select className="input" value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)}>
            <option value="">Sélectionner une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          {fieldError('categoryId')}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Prix HT *</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.priceHt}
            onChange={(e) => setField('priceHt', e.target.value)}
          />
          {fieldError('priceHt')}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">TVA (%) *</label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.tva}
            onChange={(e) => setField('tva', e.target.value)}
          />
          {fieldError('tva')}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Prix TTC (calcul automatique)</label>
          <input className="input bg-slate-50" value={computedPriceTtc.toFixed(2)} disabled />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Quantité en stock *</label>
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => setField('stock', e.target.value)}
          />
          {fieldError('stock')}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Slug</label>
          <div className="flex gap-2">
            <input className="input" value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
            <button type="button" className="btn-secondary whitespace-nowrap" onClick={() => setField('slug', slugify(form.name))}>
              Auto-générer
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Caractéristiques techniques</h3>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSpecRows((prev) => [...prev, { key: '', value: '' }])}
          >
            Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {specRows.map((row, index) => (
            <div key={`spec-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="input"
                placeholder="Caractéristique"
                value={row.key}
                onChange={(e) => setSpecField(index, 'key', e.target.value)}
              />
              <input
                className="input"
                placeholder="Valeur"
                value={row.value}
                onChange={(e) => setSpecField(index, 'value', e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSpecRows((prev) => prev.filter((_, i) => i !== index))}
                disabled={specRows.length === 1}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Images du produit</h3>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setImageRows((prev) => [...prev, { url: '', alt: '', order: prev.length }])}
          >
            Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {imageRows.map((row, index) => (
            <div key={`img-${index}`} className="rounded-xl border border-slate-200 p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <input
                  className="input"
                  placeholder="URL de l'image"
                  value={row.url}
                  onChange={(e) => setImageField(index, 'url', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Texte alternatif"
                  value={row.alt}
                  onChange={(e) => setImageField(index, 'alt', e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className="input"
                    type="number"
                    placeholder="Ordre"
                    value={row.order}
                    onChange={(e) => setImageField(index, 'order', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setImageRows((prev) => prev.filter((_, i) => i !== index))}
                    disabled={imageRows.length === 1}
                  >
                    Retirer
                  </button>
                </div>
              </div>
              {fieldError(`image_${index}`)}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
          {busy ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
