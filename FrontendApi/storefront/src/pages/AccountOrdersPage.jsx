import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../services/orders';

function groupByYear(orders) {
  const m = new Map();
  for (const o of orders) {
    const y = new Date(o.createdAt).getFullYear();
    if (!m.has(y)) m.set(y, []);
    m.get(y).push(o);
  }
  return [...m.entries()].sort((a, b) => b[0] - a[0]);
}

export default function AccountOrdersPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await getOrders({ page: 1, limit: 100 });
      return res.data.data;
    }
  });

  const groups = groupByYear(data || []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t('orders.title')}</h1>
      {isLoading ? <p className="mt-4">{t('common.loading')}</p> : null}
      {!isLoading && (!data || data.length === 0) ? <p className="mt-4 text-slate-500">{t('orders.empty')}</p> : null}

      <div className="mt-6 space-y-10">
        {groups.map(([year, orders]) => (
          <section key={year}>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">{t('orders.byYear', { year })}</h2>
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/compte/commandes/${o.id}`}
                    className="card flex flex-wrap items-center justify-between gap-4 p-4 transition hover:shadow-md"
                  >
                    <div>
                      <p className="font-semibold">
                        {t('orders.number')} {o.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(o.createdAt).toLocaleString()} · {o.status}
                      </p>
                    </div>
                    <p className="font-bold text-ocean">{Number(o.total).toFixed(2)} €</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
