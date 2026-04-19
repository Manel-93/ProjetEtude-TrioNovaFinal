import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrder, downloadInvoicePdf } from '../services/orders';
import { formatOrderAddress, formatOrderCard, getOrderStatusMeta } from '../utils/orderHistory';
import { getApiError } from '../utils/errors';

export default function AccountOrderDetailPage() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await getOrder(id);
      return res.data.data;
    }
  });

  const downloadPdf = async () => {
    if (!data?.invoice?.id) return;
    const res = await downloadInvoicePdf(data.invoice.id);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${data.invoice.invoiceNumber || data.orderNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <p>Chargement...</p>;
  if (error || !data) return <p className="text-red-600">{getApiError(error) || 'Erreur'}</p>;

  const badge = getOrderStatusMeta(data.status);
  const billingAddress = formatOrderAddress(data.billingAddress);
  const maskedCard = formatOrderCard(data.payment?.summary);

  return (
    <div className="space-y-6">
      <Link to="/compte/commandes" className="text-sm text-ocean hover:underline">
        ← Historique des commandes
      </Link>

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{data.orderNumber}</p>
            <h1 className="text-2xl font-bold text-slate-900">Detail de commande</h1>
            <p className="text-sm text-slate-600">
              {new Date(data.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paiement securise</p>
            <p className="mt-2 font-semibold text-slate-900">{maskedCard}</p>
            <p className="mt-1 text-sm text-slate-500">Seuls les 4 derniers chiffres sont affiches.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Montant total</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{Number(data.total).toFixed(2)} €</p>
            <p className="mt-1 text-sm text-slate-500">TVA incluse, transaction protegee via le serveur.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Facture</p>
            <p className="mt-2 text-sm text-slate-600">
              {data.invoice?.invoiceNumber || 'Facture indisponible'}
            </p>
            {data.invoice ? (
              <button type="button" className="btn-secondary mt-3" onClick={downloadPdf}>
                Telecharger la facture PDF
              </button>
            ) : null}
          </article>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">Produits commandes</h2>
          <ul className="mt-4 divide-y divide-slate-100">
          {(data.items || []).map((it) => (
            <li key={it.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{it.productName}</p>
                <p className="text-slate-500">Quantite : {it.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-slate-900">{Number(it.total).toFixed(2)} €</p>
                <p className="text-slate-500">{Number(it.unitPriceTtc).toFixed(2)} € / unite</p>
              </div>
            </li>
          ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
            <span>Total</span>
            <span>{Number(data.total).toFixed(2)} €</span>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Adresse de facturation</h2>
            {billingAddress.length ? (
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {billingAddress.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Aucune adresse de facturation disponible.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Statut de la commande</h2>
            <p className="mt-3 text-sm text-slate-600">
              Cette commande est actuellement <span className="font-medium text-slate-900">{badge.label.toLowerCase()}</span>.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Le detail complet reste accessible uniquement depuis votre espace authentifie.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
