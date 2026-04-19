import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../services/orders';
import { getOrderStatusMeta, groupOrdersByYear } from '../utils/orderHistory';

export default function AccountOrdersPage() {
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', search, selectedYear, selectedType, selectedState],
    queryFn: async () => {
      const res = await getOrders({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        year: selectedYear || undefined,
        productType: selectedType || undefined,
        state: selectedState || undefined
      });
      return res.data.data;
    }
  });

  const groups = groupOrdersByYear(data || []);
  const yearOptions = useMemo(
    () =>
      [...new Set((data || []).map((order) => new Date(order.createdAt).getFullYear()))].sort((a, b) => b - a),
    [data]
  );
  const productTypeOptions = useMemo(
    () =>
      [...new Set((data || []).flatMap((order) => order.productTypes || []))].filter(Boolean).sort((a, b) =>
        a.localeCompare(b)
      ),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Historique des commandes</h1>
        <p className="text-sm text-slate-600">
          Consultez vos achats securises, filtrez-les par annee, type ou etat, puis accedez au detail complet de
          chaque commande.
        </p>
      </div>

      <section className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Recherche</span>
          <input
            className="input"
            placeholder="Produit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Annee</span>
          <select className="input" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">Toutes</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Type de produit</span>
          <select className="input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">Tous</option>
            {productTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Etat</span>
          <select className="input" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
            <option value="">Tous</option>
            <option value="active">Active</option>
            <option value="terminee">Terminee</option>
          </select>
        </label>
      </section>

      {isLoading ? <p className="text-slate-500">Chargement...</p> : null}
      {!isLoading && error ? <p className="text-red-600">Impossible de charger vos commandes.</p> : null}
      {!isLoading && (!data || data.length === 0) ? (
        <p className="text-slate-500">Aucune commande ne correspond a vos filtres.</p>
      ) : null}

      <div className="mt-6 space-y-10">
        {groups.map(([year, orders]) => (
          <section key={year}>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Annee {year}</h2>
            <ul className="space-y-3">
              {orders.map((o) => {
                const badge = getOrderStatusMeta(o.status);
                const headline =
                  o.itemCount > 1 && o.primaryProductName
                    ? `${o.primaryProductName} +${o.itemCount - 1} autre${o.itemCount > 2 ? 's' : ''}`
                    : o.primaryProductName || 'Commande';
                const typeLabel = (o.productTypes || []).join(', ');

                return (
                  <li key={o.id}>
                  <Link
                    to={`/compte/commandes/${o.id}`}
                    className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{o.orderNumber}</p>
                        <p className="text-lg font-semibold text-slate-900">{headline}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                          {typeLabel ? ` · ${typeLabel}` : ''}
                          {o.paymentLast4 ? ` · ${o.paymentBrand || 'Carte'} •••• ${o.paymentLast4}` : ''}
                        </p>
                      </div>
                      <div className="space-y-2 text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                        <p className="text-lg font-bold text-slate-900">{Number(o.total).toFixed(2)} €</p>
                      </div>
                    </div>
                  </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
