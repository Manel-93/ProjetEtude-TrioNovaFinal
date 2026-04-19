import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../services/orderService';
import { downloadOrderInvoicePdf, sendOrderInvoiceEmail } from '../../services/billingService';

export default function BillingPage() {
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const { data, isLoading, error } = useQuery({
    queryKey: ['billing-orders'],
    queryFn: async () => {
      const res = await getOrders({ page: 1, limit: 30 });
      return res.data.data || [];
    }
  });

  const orders = data || [];

  const run = async (fn) => {
    setFeedback({ type: '', text: '' });
    try {
      await fn();
      setFeedback({ type: 'success', text: 'Action facturation exécutée avec succès.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Action facturation impossible.'
      });
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-slate-900">Facturation automatisée</h2>
        <p className="text-sm text-slate-500">
          Générez les PDF de facture, envoyez-les par mail et créez des avoirs.
        </p>
      </header>

      {feedback.text ? (
        <div className={`card p-4 text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
          {feedback.text}
        </div>
      ) : null}

      {isLoading ? <div className="card p-6">Chargement...</div> : null}
      {error ? <div className="card p-6 text-red-600">Impossible de charger les commandes.</div> : null}

      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions facturation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-slate-800">{order.orderNumber || order.id}</td>
                  <td className="px-4 py-3 text-slate-700">{order.customerEmail || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">EUR {Number(order.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700 capitalize">{order.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          run(async () => {
                            const res = await downloadOrderInvoicePdf(order.id);
                            const blob = new Blob([res.data], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `facture-${order.orderNumber || order.id}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          })
                        }
                      >
                        Télécharger PDF
                      </button>
                      <button className="btn-secondary" onClick={() => run(() => sendOrderInvoiceEmail(order.id))}>
                        Envoyer par mail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
