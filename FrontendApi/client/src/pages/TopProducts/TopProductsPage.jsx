import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProductThumb from '../../components/ProductThumb';
import { getProducts } from '../../services/productService';
import {
  addTopProduct,
  getTopProductsAdmin,
  removeTopProduct,
  reorderTopProducts
} from '../../services/topProductService';

function extractError(err, fallback) {
  const d = err?.response?.data;
  return d?.error?.message || d?.message || fallback;
}

function normalizeProductsPayload(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.products)) return raw.products;
  return [];
}

export default function TopProductsPage() {
  const queryClient = useQueryClient();
  const [pickerSearch, setPickerSearch] = useState('');
  const [debouncedPickerSearch, setDebouncedPickerSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPickerSearch(pickerSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [pickerSearch]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      const res = await getTopProductsAdmin();
      return res.data.data || [];
    },
    staleTime: 1000 * 30
  });

  const items = Array.isArray(data) ? data : [];
  const topIds = new Set(items.map((r) => Number(r.productId)));

  const { data: pickerData, isLoading: pickerLoading, isError: pickerIsError, error: pickerError } = useQuery({
    queryKey: ['admin-top-products', 'picker', debouncedPickerSearch],
    queryFn: async () => {
      const res = await getProducts({
        page: 1,
        limit: 100,
        search: debouncedPickerSearch || undefined
      });
      return normalizeProductsPayload(res?.data);
    },
    staleTime: 1000 * 20
  });

  const pickableProducts = (Array.isArray(pickerData) ? pickerData : []).filter(
    (p) => !topIds.has(Number(p.id))
  );

  useEffect(() => {
    if (!selectedProductId && pickableProducts.length > 0) {
      setSelectedProductId(String(pickableProducts[0].id));
    }
  }, [pickableProducts, selectedProductId]);

  const reorderMutation = useMutation({
    mutationFn: (orderedProductIds) => reorderTopProducts(orderedProductIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-top-products'] });
    }
  });

  const addMutation = useMutation({
    mutationFn: (productId) => addTopProduct(productId),
    onSuccess: () => {
      setSelectedProductId('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['admin-top-products'] });
    },
    onError: (err) => {
      setFormError(extractError(err, 'Impossible d’ajouter le produit.'));
    }
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => removeTopProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-top-products'] });
    }
  });

  const move = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const ids = items.map((r) => r.productId);
    const copy = [...ids];
    [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
    reorderMutation.mutate(copy);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setFormError('');
    const id = parseInt(String(selectedProductId).trim(), 10);
    if (!id || id < 1) {
      setFormError('Choisis un produit dans la liste.');
      return;
    }
    addMutation.mutate(id);
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-slate-900">Top produits</h2>
      </header>

      <div className="card p-4">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input
            label="Rechercher par nom"
            id="top-product-search"
            type="search"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Tape pour filtrer la liste…"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
                htmlFor="top-product-select"
              >
                Produit à ajouter
              </label>
              <select
                id="top-product-select"
                className="input w-full"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={pickerLoading}
              >
                <option value="">{pickerLoading ? 'Chargement…' : '— Choisir un produit —'}</option>
                {pickableProducts.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                    {p.status && p.status !== 'active' ? ` (${p.status})` : ''}
                  </option>
                ))}
              </select>
              {pickerIsError ? (
                <p className="mt-1 text-xs text-red-600">
                  {extractError(pickerError, 'Impossible de charger les produits à ajouter.')}
                </p>
              ) : null}
              {!pickerLoading && pickableProducts.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  Aucun produit disponible (ou tous sont déjà dans le top). Ajuste la recherche.
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={addMutation.isPending || !selectedProductId || pickerLoading}
            >
              {addMutation.isPending ? 'Ajout...' : 'Ajouter au top'}
            </Button>
          </div>
        </form>
        {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
      </div>

      {isLoading && <div className="card p-6">Chargement...</div>}
      {isError && (
        <div className="card border-red-200 p-6 text-sm text-red-600">
          {extractError(error, 'Impossible de charger la liste.')}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card p-6 text-sm text-slate-500">Aucun top produit pour l’instant.</div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ordre</th>
                  <th className="px-4 py-3">Visuel</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Prix TTC</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={row.productId} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-3">
                      <ProductThumb
                        url={row.imageUrl}
                        alt=""
                        imgClassName="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                        fallbackClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.name}</p>
                      {row.slug ? <p className="text-xs text-slate-500">{row.slug}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">EUR {Number(row.priceTtc || 0).toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.stock}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          disabled={index === 0 || reorderMutation.isPending}
                          onClick={() => move(index, -1)}
                          aria-label="Monter"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          disabled={index === items.length - 1 || reorderMutation.isPending}
                          onClick={() => move(index, 1)}
                          aria-label="Descendre"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-40"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(row.productId)}
                          aria-label="Retirer du top"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
