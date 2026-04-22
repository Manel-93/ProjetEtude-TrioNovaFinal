import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../services/orderService';
import {
  createAutomaticOrderCreditNote,
  deleteOrderInvoice,
  downloadOrderInvoicePdf,
  sendOrderInvoiceEmail
} from '../../services/billingService';

export default function BillingPage() {
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const creditFormRef = useRef(null);
  const [creditForm, setCreditForm] = useState({
    orderId: null,
    triggerType: 'goods_return',
    reason: '',
    amount: ''
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['billing-orders'],
    queryFn: async () => {
      const res = await getOrders({ page: 1, limit: 30 });
      return res.data.data || [];
    }
  });

  const orders = data || [];
  const selectedOrder = useMemo(
    () => orders.find((o) => Number(o.id) === Number(creditForm.orderId)) || null,
    [orders, creditForm.orderId]
  );

  useEffect(() => {
    if (selectedOrder && creditFormRef.current) {
      creditFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedOrder]);

  const run = async (fn) => {
    setFeedback({ type: '', text: '' });
    try {
      await fn();
      setFeedback({ type: 'success', text: 'Action facturation exécutée avec succès.' });
      await refetch();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Action facturation impossible.'
      });
    }
  };

  const openCreditForm = (orderId, triggerType) => {
    setCreditForm({
      orderId,
      triggerType,
      reason: '',
      amount: ''
    });
    setFeedback({
      type: 'success',
      text: `Formulaire d'avoir ouvert: ${triggerLabels[triggerType]}`
    });
  };

  const closeCreditForm = () => {
    setCreditForm({
      orderId: null,
      triggerType: 'goods_return',
      reason: '',
      amount: ''
    });
  };

  const triggerLabels = {
    order_cancellation: 'Annulation commande',
    goods_return: 'Retour marchandise',
    billing_error: 'Erreur facturation'
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-slate-900">Facturation automatisée</h2>
        <p className="text-sm text-slate-500">
          Générez les PDF de facture, envoyez-les par mail et créez des avoirs automatiques.
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
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          run(() =>
                            deleteOrderInvoice(order.id, {
                              reason: 'Suppression de facture depuis le back-office'
                            })
                          )
                        }
                      >
                        Supprimer facture
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => openCreditForm(order.id, 'order_cancellation')}
                      >
                        Avoir: Annulation
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => openCreditForm(order.id, 'goods_return')}
                      >
                        Avoir: Retour
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => openCreditForm(order.id, 'billing_error')}
                      >
                        Avoir: Erreur
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedOrder ? (
        <div ref={creditFormRef} className="card space-y-3 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Créer un avoir automatique - Commande {selectedOrder.orderNumber || selectedOrder.id}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Déclencheur</label>
              <select
                className="input"
                value={creditForm.triggerType}
                onChange={(e) => setCreditForm((prev) => ({ ...prev, triggerType: e.target.value }))}
              >
                <option value="order_cancellation">{triggerLabels.order_cancellation}</option>
                <option value="goods_return">{triggerLabels.goods_return}</option>
                <option value="billing_error">{triggerLabels.billing_error}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Montant (EUR)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder={Number(selectedOrder.total || 0).toFixed(2)}
                value={creditForm.amount}
                onChange={(e) => setCreditForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Motif</label>
              <input
                className="input"
                type="text"
                placeholder="Motif d'avoir"
                value={creditForm.reason}
                onChange={(e) => setCreditForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                run(async () => {
                  const payload = {
                    triggerType: creditForm.triggerType,
                    reason: creditForm.reason || undefined,
                    amount: creditForm.amount !== '' ? Number(creditForm.amount) : undefined
                  };
                  await createAutomaticOrderCreditNote(selectedOrder.id, payload);
                  closeCreditForm();
                })
              }
            >
              Générer l'avoir automatique
            </button>
            <button className="btn-secondary" onClick={closeCreditForm}>
              Annuler
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Le solde client est mis à jour automatiquement côté backend lors de la génération de l&apos;avoir.
          </p>
        </div>
      ) : null}
    </section>
  );
}
