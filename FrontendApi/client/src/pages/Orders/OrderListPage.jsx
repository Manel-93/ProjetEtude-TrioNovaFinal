import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Table from '../../components/ui/Table';
import { getOrders } from '../../services/orderService';
import { Link } from 'react-router-dom';

export default function OrderListPage() {
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const columns = [
    { header: 'ID commande', accessor: 'id' },
    { header: 'Client', accessor: 'customer' },
    { header: 'Date', accessor: 'date' },
    { header: 'Montant total', accessor: 'total' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Actions', accessor: 'actions' }
  ];

  const {
    data,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['orders', page],
    queryFn: async () => {
      setError('');
      const res = await getOrders({ page, limit: 20 });
      return res.data;
    },
    keepPreviousData: true,
    onError: (err) => {
      setError(err?.response?.data?.error?.message || 'Impossible de charger les commandes.');
    }
  });

  const orders = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const totalItems = pagination.total || 0;
  const loading = isLoading || isFetching;

  const handleChangePage = (next) => {
    setPage(next);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Commandes</h2>
          <p className="text-sm text-slate-500">
            Suivi et gestion des commandes clients.
          </p>
        </div>
      </header>

      {loading && <div className="card p-6">Chargement des commandes...</div>}
      {error && <div className="card border-red-200 p-6 text-red-600">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="card p-6 text-sm text-slate-500">Aucune commande trouvée.</div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <Table columns={columns} caption="Liste des commandes">
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-800">{order.orderNumber || order.id}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {order.customerEmail || order.customerName || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-800">
                  EUR {Number(order.total || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-ocean">
                  {/* Bouton "voir détail" à brancher quand la page de détail sera prête */}
                  <Link to={`/admin/orders/${order.id}`} className="font-medium underline-offset-4 hover:underline">
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </Table>

          <div className="card mt-3 flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">Total commandes : {totalItems}</p>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => handleChangePage(page - 1)}
              >
                Précédent
              </button>
              <span className="text-slate-700">
                Page {page} / {totalPages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => handleChangePage(page + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

