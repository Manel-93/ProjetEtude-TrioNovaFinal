import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Download, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getProducts } from '../../services/productService';
import {
  getAdminHomeCarousel,
  putAdminHomeCarousel,
  uploadAdminHomeCarouselImages
} from '../../services/homeCarouselApiService';
import { resolveMediaUrl } from '../../utils/mediaUrl';

function primaryProductImageUrl(product) {
  if (!product?.images?.length) return '';
  const imgs = [...product.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const p = imgs.find((i) => i.isPrimary) || imgs[0];
  return p?.url || '';
}

function mapApiToSlide(row) {
  return {
    key: `db-${row.id}`,
    dbId: row.id,
    productId: row.productId ?? null,
    imageUrl: row.imageUrl || '',
    linkUrl: row.linkUrl || '',
    title: row.title || '',
    subtitle: row.subtitle || '',
    active: row.active !== false,
    sortOrder: row.sortOrder ?? 0
  };
}

function createEmptySlide() {
  return {
    key: `new-${crypto.randomUUID()}`,
    dbId: null,
    productId: null,
    imageUrl: '',
    linkUrl: '',
    title: '',
    subtitle: '',
    active: true,
    sortOrder: 0
  };
}

function slidesToPayload(list) {
  return list.map((s, i) => ({
    productId: s.productId || null,
    imageUrl: s.imageUrl || '',
    linkUrl: s.linkUrl || '',
    title: s.title || '',
    subtitle: s.subtitle || '',
    active: s.active !== false,
    sortOrder: i
  }));
}

export default function HomeCarouselPage() {
  const queryClient = useQueryClient();
  const [slides, setSlides] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const { data: apiSlides, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-home-carousel'],
    queryFn: async () => {
      const res = await getAdminHomeCarousel();
      return res.data.data || [];
    }
  });

  const { data: productsRes } = useQuery({
    queryKey: ['admin-home-carousel-products'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 200, status: 'active' });
      return res.data?.data || [];
    }
  });

  const products = productsRes || [];

  useEffect(() => {
    if (Array.isArray(apiSlides)) {
      setSlides(apiSlides.length ? apiSlides.map(mapApiToSlide) : []);
    }
  }, [apiSlides]);

  const saveMutation = useMutation({
    mutationFn: (list) => putAdminHomeCarousel(slidesToPayload(list)),
    onSuccess: () => {
      setSaveError('');
      setSaveMsg('Carrousel enregistré sur le serveur.');
      setTimeout(() => setSaveMsg(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['admin-home-carousel'] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error?.messages?.map((m) => m.message).join(' ') ||
        err?.response?.data?.error?.message ||
        'Enregistrement impossible.';
      setSaveError(msg);
    }
  });

  const activeCount = useMemo(() => slides.filter((s) => s.active).length, [slides]);

  const persistLocal = (next) => {
    setSlides(next);
  };

  const saveToServer = () => {
    setSaveError('');
    saveMutation.mutate(slides);
  };

  const addSlide = () => {
    persistLocal([...slides, createEmptySlide()]);
  };

  const removeSlide = (key) => {
    persistLocal(slides.filter((s) => s.key !== key));
  };

  const updateSlide = (key, patch) => {
    persistLocal(slides.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const applyProduct = (key, productId) => {
    const pid = productId ? Number(productId) : null;
    if (!pid) {
      updateSlide(key, { productId: null });
      return;
    }
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const rel = primaryProductImageUrl(p);
    updateSlide(key, {
      productId: pid,
      imageUrl: rel,
      title: p.name || '',
      subtitle: (p.description || '').slice(0, 220),
      linkUrl: p.slug ? `/produit/${encodeURIComponent(p.slug)}` : ''
    });
  };

  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= slides.length) return;
    const copy = [...slides];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    persistLocal(copy);
  };

  const onDropUpload = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    setSaveError('');
    try {
      const res = await uploadAdminHomeCarouselImages(files);
      const uploaded = res.data.data || [];
      const mapped = uploaded.map((file) => ({
        ...createEmptySlide(),
        imageUrl: file.url
      }));
      persistLocal([...slides, ...mapped]);
      setSaveMsg(`${mapped.length} image(s) ajoutée(s). Pensez à enregistrer.`);
    } catch (err) {
      setSaveError(err?.response?.data?.error?.message || "Impossible d'uploader les images.");
    } finally {
      setUploading(false);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(slidesToPayload(slides), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'home-carousel.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-ink">Carrousel d’accueil</h2>
        <p className="mt-1 text-sm text-slate-500">
          Les diapositives sont stockées en base et affichées sur la boutique. Vous pouvez lier une diapositive à un
          produit (image, titre, lien) ou saisir une image et un lien manuellement.
        </p>
      </header>

      {isError ? (
        <div className="card border-red-200 p-4 text-sm text-red-700">
          {error?.response?.data?.error?.message || 'Impossible de charger le carrousel.'}
        </div>
      ) : null}

      {saveError ? (
        <div className="card border-red-200 bg-red-50/80 p-4 text-sm text-red-800">{saveError}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={addSlide} disabled={isLoading}>
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter une diapositive
          </span>
        </Button>
        <Button type="button" variant="secondary" onClick={saveToServer} disabled={saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer sur le serveur'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isLoading}>
          Recharger
        </Button>
        <Button type="button" variant="secondary" onClick={downloadJson} disabled={slides.length === 0}>
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" aria-hidden />
            Exporter JSON
          </span>
        </Button>
        {saveMsg ? <span className="text-sm text-green-700">{saveMsg}</span> : null}
        <span className="text-xs text-slate-500">
          {slides.length} diapositive(s) · {activeCount} active(s)
        </span>
      </div>

      <div
        className="card border-dashed p-5 text-sm text-slate-600"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropUpload}
      >
        Déposez ici plusieurs images pour les uploader et créer automatiquement des diapositives.
        {uploading ? <span className="ml-2 text-ocean">Upload en cours...</span> : null}
      </div>

      {isLoading ? <div className="card p-6 text-sm text-slate-500">Chargement…</div> : null}

      {!isLoading && slides.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">Aucune diapositive. Ajoutez-en une puis enregistrez.</div>
      ) : null}

      {!isLoading && slides.length > 0 ? (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide.key}
              className="card p-4"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex == null || dragIndex === index) return;
                const copy = [...slides];
                const [moved] = copy.splice(dragIndex, 1);
                copy.splice(index, 0, moved);
                setDragIndex(null);
                persistLocal(copy);
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Diapositive {index + 1}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={slide.active}
                      onChange={(e) => updateSlide(slide.key, { active: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Monter"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    disabled={index === slides.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Descendre"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                    onClick={() => removeSlide(slide.key)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor={`product-${slide.key}`}>
                  Produit (optionnel — remplit image, titre, sous-titre, lien)
                </label>
                <select
                  id={`product-${slide.key}`}
                  className="input max-w-xl"
                  value={slide.productId ?? ''}
                  onChange={(e) => applyProduct(slide.key, e.target.value)}
                >
                  <option value="">— Aucun (saisie manuelle)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (id {p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="URL de l’image"
                  id={`carousel-img-${slide.key}`}
                  value={slide.imageUrl}
                  onChange={(e) => updateSlide(slide.key, { imageUrl: e.target.value })}
                  placeholder="https://… ou chemin /uploads/…"
                />
                <Input
                  label="Lien au clic (optionnel)"
                  id={`carousel-link-${slide.key}`}
                  value={slide.linkUrl}
                  onChange={(e) => updateSlide(slide.key, { linkUrl: e.target.value })}
                  placeholder="/produit/… ou URL externe"
                />
                <Input
                  label="Titre"
                  id={`carousel-title-${slide.key}`}
                  value={slide.title}
                  onChange={(e) => updateSlide(slide.key, { title: e.target.value })}
                />
                <Input
                  label="Sous-titre"
                  id={`carousel-sub-${slide.key}`}
                  value={slide.subtitle}
                  onChange={(e) => updateSlide(slide.key, { subtitle: e.target.value })}
                />
              </div>
              {slide.imageUrl ? (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-slate-500">Aperçu</p>
                  <img
                    src={resolveMediaUrl(slide.imageUrl)}
                    alt=""
                    className="h-28 max-w-full rounded-lg border border-slate-200 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0.3';
                    }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
