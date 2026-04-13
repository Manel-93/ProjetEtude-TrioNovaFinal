import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../services/orderService';

export default function OrderDetailPage() {
  const { id } = useParams();

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

  if (isLoading) return <div className="card p-6">Chargement de la commande...</div>;
  if (isError)
    return (
      <div className="card border-red-200 p-6 text-red-600">
        {error?.response?.data?.error?.message || 'Impossible de charger la commande.'}
      </div>
    );
  if (!data) return <div className="card p-6">Commande introuvable.</div>;

  const order = data;
  const last4 = order.paymentLast4 || order.cardLast4 || '';
  const maskedCard = last4 ? `**** **** **** ${last4}` : 'Non disponible';

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
                      EUR {Number(item.unitPrice || item.price || 0).toFixed(2)}
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
            <h3 className="text-sm font-semibold text-slate-900">Adresse de facturation</h3>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
              {order.billingAddress ||
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
              {order.paymentMethod || 'Non disponible'}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Carte :</span> {maskedCard}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Statut :</span>{' '}
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                {order.status}
              </span>
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

