import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getOrder, downloadInvoicePdf } from '../services/orders';

export default function AccountOrderDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

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

  if (isLoading) return <p>{t('common.loading')}</p>;
  if (error || !data) return <p className="text-red-600">{t('common.error')}</p>;

  return (
    <div className="space-y-6">
      <Link to="/compte/commandes" className="text-sm text-ocean hover:underline">
        ← {t('orders.title')}
      </Link>
      <h1 className="text-2xl font-bold">
        {t('orders.number')} {data.orderNumber}
      </h1>
      <p className="text-sm text-slate-600">
        {new Date(data.createdAt).toLocaleString()} · {data.status}
      </p>

      <div className="card p-4">
        <h2 className="font-semibold">Articles</h2>
        <ul className="mt-2 divide-y divide-slate-100">
          {(data.items || []).map((it) => (
            <li key={it.id} className="flex justify-between py-2 text-sm">
              <span>
                {it.productName} × {it.quantity}
              </span>
              <span>{Number(it.total).toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-slate-200 pt-2 font-bold">
          <span>{t('orders.total')}</span>
          <span>{Number(data.total).toFixed(2)} €</span>
        </div>
      </div>

      {data.invoice ? (
        <button type="button" className="btn-secondary" onClick={downloadPdf}>
          {t('orders.invoice')}
        </button>
      ) : null}
    </div>
  );
}
