import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { deleteProduct, getProducts } from '../../services/productService';
import ProductTable from '../../components/ProductTable';
import BulkActions from '../../components/BulkActions';
import ConfirmModal from '../../components/ConfirmModal';

export default function ProductsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState('single');
  const [targetId, setTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['products', page, search],
    queryFn: async () => {
      setError('');
      const res = await getProducts({ page, limit: 20, search: search || undefined });
      return res.data;
    },
    keepPreviousData: true,
    onError: (err) => {
      setError(err?.response?.data?.error?.message || 'Impossible de charger les produits.');
    }
  });

  const items = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total || 0;
  const loading = isLoading || isFetching;

  const sortedItems = useMemo(() => {
    const list = [...items];
    const factor = sortDir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * factor;
      }
      if (sortBy === 'priceHt') {
        return (Number(a.priceHt || 0) - Number(b.priceHt || 0)) * factor;
      }
      if (sortBy === 'priceTtc') {
        return (Number(a.priceTtc || 0) - Number(b.priceTtc || 0)) * factor;
      }
      if (sortBy === 'tva') {
        return (Number(a.tva || 0) - Number(b.tva || 0)) * factor;
      }
      if (sortBy === 'category') {
        return String(a.categoryId ?? '').localeCompare(String(b.categoryId ?? '')) * factor;
      }
      if (sortBy === 'stock') {
        return (Number(a.stock || 0) - Number(b.stock || 0)) * factor;
      }
      if (sortBy === 'status') {
        const sA = Number(a.stock || 0) > 0 ? 'available' : 'out';
        const sB = Number(b.stock || 0) > 0 ? 'available' : 'out';
        return sA.localeCompare(sB) * factor;
      }
      return 0;
    });

    return list;
  }, [items, sortBy, sortDir]);

  const onSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDir('asc');
  };

  const onToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onToggleSelectAll = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        sortedItems.forEach((item) => next.add(item.id));
      } else {
        sortedItems.forEach((item) => next.delete(item.id));
      }
      return next;
    });
  };

  const requestDeleteOne = (id) => {
    setTargetId(id);
    setConfirmMode('single');
    setConfirmOpen(true);
  };

  const requestDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setTargetId(null);
    setConfirmMode('bulk');
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      if (confirmMode === 'single' && targetId != null) {
        await deleteProduct(targetId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }

      if (confirmMode === 'bulk') {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => deleteProduct(id)));
        setSelectedIds(new Set());
      }

      setConfirmOpen(false);
      await refetch();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete product(s).');
    } finally {
      setDeleting(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSelectedIds(new Set());
    refetch();
  };

  const onChangePage = (nextPage) => {
    setPage(nextPage);
    setSelectedIds(new Set());
  };

  const exportCsv = () => {
    const rows = [
      ['Image', 'Nom', 'Prix HT', 'TVA', 'Prix TTC', 'Stock', 'Statut'],
      ...sortedItems.map((item) => {
        const img = item?.images?.[0]?.url || '';
        const status = Number(item.stock || 0) > 0 ? 'Disponible' : 'Rupture';
        return [
          img,
          item.name || '',
          Number(item.priceHt || 0).toFixed(2),
          Number(item.tva || 0).toFixed(2),
          Number(item.priceTtc || 0).toFixed(2),
          String(item.stock || 0),
          status
        ];
      })
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogue-produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={onSearchSubmit} className="flex gap-2">
            <input
              className="input"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-secondary" type="submit">Rechercher</button>
          </form>
          <div className="flex gap-2">
            <button className="btn-secondary inline-flex items-center gap-2" type="button" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <Link className="btn-primary" to="/admin/products/new">Nouveau produit</Link>
          </div>
        </div>
      </div>

      <BulkActions
        selectedCount={selectedIds.size}
        onDeleteSelected={requestDeleteSelected}
        onClearSelection={() => setSelectedIds(new Set())}
        deleting={deleting}
      />

      {loading ? <div className="card p-6">Chargement des produits…</div> : null}
      {error ? <div className="card border-red-200 p-6 text-red-600">{error}</div> : null}

      {!loading && !error && sortedItems.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">Aucun produit trouvé.</p>
        </div>
      ) : null}

      {!loading && !error && sortedItems.length > 0 ? (
        <>
          <ProductTable
            products={sortedItems}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleSelectAll={onToggleSelectAll}
            onRequestDelete={requestDeleteOne}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
          />

          <div className="card flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">Total produits : {totalItems}</p>
            <div className="flex items-center gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => onChangePage(page - 1)}>
                Précédent
              </button>
              <span className="text-slate-700">Page {page} / {totalPages}</span>
              <button className="btn-secondary" disabled={page >= totalPages} onClick={() => onChangePage(page + 1)}>
                Suivant
              </button>
            </div>
          </div>
        </>
      ) : null}

      <ConfirmModal
        open={confirmOpen}
        title={confirmMode === 'single' ? 'Supprimer le produit' : 'Supprimer les produits sélectionnés'}
        message={
          confirmMode === 'single'
            ? 'Ce produit sera supprimé définitivement. Continuer ?'
            : `Vous allez supprimer ${selectedIds.size} produit(s). Continuer ?`
        }
        confirmLabel={confirmMode === 'single' ? 'Supprimer' : 'Tout supprimer'}
        loading={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}