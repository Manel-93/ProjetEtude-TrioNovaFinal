import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../../services/orderService';

function formatAddressBlock(addr) {
  if (!addr) return '';
  if (typeof addr === 'string') return addr.trim();
  const lines = [];
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim();
  if (name) lines.push(name);
  if (addr.company) lines.push(addr.company);
  if (addr.addressLine1) lines.push(addr.addressLine1);
  if (addr.addressLine2) lines.push(addr.addressLine2);
  const cityLine = [addr.postalCode, addr.city].filter(Boolean).join(' ').trim();
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  if (addr.phone) lines.push(`Tél. ${addr.phone}`);
  return lines.join('\n').trim();
}

function unitPriceTtcDisplay(item) {
  const v =
    item.unitPriceTtc ??
    item.unit_price_ttc ??
    item.unitPrice ??
    item.price ??
    0;
  return Number(v);
}

function getOrderStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (s === 'processing') return 'bg-sky-100 text-sky-800';
  if (s === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (s === 'canceled') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function getOrderStatusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return 'En attente';
  if (s === 'processing') return 'En cours';
  if (s === 'completed') return 'Finalisée';
  if (s === 'canceled') return 'Annulée';
  return status || 'Inconnu';
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await getOrderById(id);
      return res.data.data || res.data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      updateOrderStatus(id, {
        status: 'canceled',
        notes: 'Annulation manuelle depuis le back-office'
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order', id] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: () =>
      updateOrderStatus(id, {
        status: 'completed',
        notes: 'Finalisation manuelle depuis le back-office'
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order', id] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  if (isLoading) return <div className="card p-6">Chargement de la commande...</div>;
  if (isError)
    return (
      <div className="card border-red-200 p-6 text-red-600">
        {error?.response?.data?.error?.message || 'Impossible de charger la commande.'}
      </div>
    );
  if (!data) return <div className="card p-6">Commande introuvable.</div>;

  const order = data;
  const canCancel = ['pending', 'processing'].includes(String(order.status || '').toLowerCase());
  const canFinalize = ['pending', 'processing'].includes(String(order.status || '').toLowerCase());

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Commande #{order.orderNumber || order.id}
          </h2>
          <p className="text-sm text-slate-500">
            Créée le{' '}
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'date inconnue'}.
          </p>
        </div>
        <Link to="/admin/orders" className="btn-secondary">
          Retour aux commandes
        </Link>
      </header>
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
            disabled={!canCancel || cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? 'Annulation...' : 'Annuler la commande'}
          </button>
          <button
            type="button"
            className="btn-secondary border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            disabled={!canFinalize || finalizeMutation.isPending}
            onClick={() => finalizeMutation.mutate()}
          >
            {finalizeMutation.isPending ? 'Finalisation...' : 'Finaliser la commande'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <article className="card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900">Produits commandés</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Produit</th>
                  <th className="px-3 py-2 font-semibold">Quantité</th>
                  <th className="px-3 py-2 font-semibold">Prix unitaire</th>
                  <th className="px-3 py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => (
                  <tr key={item.id || item.productId} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-800">
                      {item.productName || item.name || `#${item.productId}`}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-2 text-slate-700">
                      EUR {unitPriceTtcDisplay(item).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      EUR {Number(item.total || item.lineTotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4">
          <article className="card p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-900">Client</h3>
            {order.customer ? (
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Nom :</span>{' '}
                  {order.customer.displayName ||
                    [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') ||
                    '—'}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">E-mail :</span> {order.customer.email}
                </p>
                {order.customer.id != null && (
                  <p className="text-xs text-slate-500">Utilisateur #{order.customer.id}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {order.userId != null
                  ? 'Client enregistré introuvable (compte supprimé ou indisponible).'
                  : 'Commande sans compte client lié.'}
              </p>
            )}
          </article>

          <article className="card p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-900">Adresse de facturation</h3>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
              {formatAddressBlock(order.billingAddress) ||
                [
                  order.billingName,
                  order.billingStreet,
                  `${order.billingZip || ''} ${order.billingCity || ''}`,
                  order.billingCountry
                ]
                  .filter(Boolean)
                  .join('\n') ||
                'Non disponible'}
            </p>
          </article>

          <article className="card p-4 sm:p-6 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Paiement</h3>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Montant total :</span>{' '}
              EUR {Number(order.total || 0).toFixed(2)}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Mode de paiement :</span>{' '}
              {order.paymentMethodLabel ||
                order.payment?.summary?.label ||
                order.paymentMethod ||
                'Non disponible'}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Statut :</span>{' '}
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getOrderStatusBadge(
                  order.status
                )}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

