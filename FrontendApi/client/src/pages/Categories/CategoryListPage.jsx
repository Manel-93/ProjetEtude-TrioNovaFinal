import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ConfirmModal';
import ProductThumb from '../../components/ProductThumb';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '../../services/productService';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function flattenHierarchy(nodes = [], parentLabel = '') {
  const out = [];
  const walk = (arr, labelPrefix) => {
    arr.forEach((n) => {
      const label = labelPrefix ? `${labelPrefix} > ${n.name}` : n.name;
      out.push({
        id: n.id,
        name: n.name,
        description: n.description,
        imageUrl: n.imageUrl || n.image?.url || '',
        imageAlt: n.imageAlt || n.image?.alt || '',
        parentId: n.parentId ?? null,
        displayOrder: n.displayOrder ?? 0,
        status: n.status ?? 'active',
        slug: n.slug,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        _selectLabel: label
      });
      if (Array.isArray(n.children) && n.children.length > 0) {
        walk(n.children, label);
      }
    });
  };
  walk(nodes, parentLabel);
  return out;
}

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  return data?.error?.message || data?.message || fallback;
}

export default function CategoryListPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' | 'edit'
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    imageAlt: '',
    slug: '',
    parentId: '',
    displayOrder: 0,
    status: 'active'
  });

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['categories', 'admin', 'hierarchy'],
    queryFn: async () => {
      const res = await getCategories({ hierarchy: true });
      // adminCategoryController renvoie { success: true, data: [...] }
      return res.data.data || res.data;
    },
    staleTime: 1000 * 60
  });

  const rootNodes = Array.isArray(data) ? data : data?.data || [];
  const categoriesFlat = useMemo(() => flattenHierarchy(rootNodes), [rootNodes]);

  const columns = [
    { header: 'Ordre', accessor: 'displayOrder' },
    { header: 'Image', accessor: 'imageUrl' },
    { header: 'Nom', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    { header: 'Actions', accessor: 'actions' }
  ];

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      imageUrl: '',
      imageAlt: '',
      slug: '',
      parentId: '',
      displayOrder: 0,
      status: 'active'
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
    setMode('create');
    setSaveError('');
  };

  const openCreate = () => {
    resetForm();
    setMode('create');
    setSaveError('');
    setModalOpen(true);
  };

  const openEdit = async (category) => {
    setMode('edit');
    setSaveError('');
    setForm({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      imageAlt: category.imageAlt || '',
      slug: category.slug || '',
      parentId: category.parentId ?? '',
      displayOrder: category.displayOrder ?? 0,
      status: category.status || 'active'
    });
    setModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      setDeleteError('');
      setConfirmOpen(false);
      setConfirmTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['categories', 'admin', 'hierarchy'] });
    },
    onError: (err) => {
      setDeleteError(extractApiError(err, 'La suppression a échoué.'));
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['categories', 'admin', 'hierarchy'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['categories', 'admin', 'hierarchy'] });
    }
  });

  const [editingId, setEditingId] = useState(null);

  const openEditWithId = (category) => {
    setEditingId(category.id);
    openEdit(category);
  };

  useEffect(() => {
    if (!modalOpen) setEditingId(null);
  }, [modalOpen]);

  const handleSave = async () => {
    setSaveError('');

    const name = String(form.name || '').trim();
    const slug = slugify(form.slug || name);
    if (!name) return;
    if (!slug) return;

    if (mode === 'edit' && !editingId) {
      setSaveError('Catégorie cible introuvable.');
      return;
    }

    const payload = {
      name,
      description: form.description ? String(form.description).trim() : null,
      imageUrl: form.imageUrl ? String(form.imageUrl).trim() : '',
      imageAlt: form.imageAlt ? String(form.imageAlt).trim() : '',
      slug,
      parentId: form.parentId === '' ? null : Number(form.parentId),
      displayOrder: Number(form.displayOrder || 0),
      status: form.status
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({ id: editingId, payload });
      }
    } catch (err) {
      setSaveError(extractApiError(err, "Impossible d'enregistrer la catégorie."));
    }
  };

  const selectOptions = useMemo(() => {
    return categoriesFlat
      .slice()
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((c) => ({ id: c.id, label: c._selectLabel }));
  }, [categoriesFlat]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Catégories</h2>
          <p className="text-sm text-slate-500">Créer, modifier et supprimer les catégories.</p>
        </div>
        <Button onClick={openCreate} type="button">
          Ajouter une catégorie
        </Button>
      </header>

      {isLoading && <div className="card p-6">Chargement des catégories...</div>}
      {isError && (
        <div className="card border-red-200 p-6 text-red-600">
          {error?.response?.data?.error?.message || 'Impossible de charger les catégories.'}
        </div>
      )}

      {!isLoading && !isError && categoriesFlat.length === 0 && (
        <div className="card p-6 text-sm text-slate-500">Aucune catégorie trouvée.</div>
      )}

      {!isLoading && !isError && categoriesFlat.length > 0 && (
        <Table columns={columns} caption="Liste des catégories">
          {categoriesFlat
            .slice()
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            .map((cat) => (
              <tr key={cat.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-600">{cat.displayOrder ?? 0}</td>
                <td className="px-4 py-3">
                  <ProductThumb url={cat.imageUrl} alt="" />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{cat.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{cat.description || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => openEditWithId(cat)}
                      aria-label={`Modifier la catégorie ${cat.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      onClick={() => {
                        setDeleteError('');
                        setConfirmTargetId(cat.id);
                        setConfirmOpen(true);
                      }}
                      aria-label={`Supprimer la catégorie ${cat.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        title={mode === 'create' ? 'Créer une catégorie' : 'Modifier la catégorie'}
        onClose={closeModal}
      >
        <div className="space-y-4">
          {saveError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError}</div>
          ) : null}
          <Input
            label="Nom"
            id="cat-name"
            value={form.name}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, name: v, slug: prev.slug ? prev.slug : slugify(v) }));
            }}
          />

          <Input
            label="Slug"
            id="cat-slug"
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            helperText="Ex: electronique, materiel-labo..."
          />

          <Input
            label="URL de l'image"
            id="cat-image-url"
            value={form.imageUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://..."
          />

          <Input
            label="Texte alternatif image (optionnel)"
            id="cat-image-alt"
            value={form.imageAlt}
            onChange={(e) => setForm((prev) => ({ ...prev, imageAlt: e.target.value }))}
          />

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="cat-status">
              Statut
            </label>
            <select
              id="cat-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>

          <Input
            label="Ordre d'affichage"
            id="cat-displayOrder"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
          />

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="cat-parent">
              Parent (optionnel)
            </label>
            <select
              id="cat-parent"
              className="input"
              value={form.parentId}
              onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
            >
              <option value="">Aucun</option>
              {selectOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="cat-desc">
              Description
            </label>
            <textarea
              id="cat-desc"
              className="input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optionnel"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closeModal} type="button">
              Annuler
            </Button>
            <Button onClick={handleSave} type="button" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer une catégorie"
        message="Cette action supprimera la catégorie. Confirmer ?"
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={() => {
          if (confirmTargetId == null || confirmTargetId === '') return;
          setDeleteError('');
          deleteMutation.mutate(confirmTargetId);
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
          setDeleteError('');
        }}
      />
    </section>
  );
}


