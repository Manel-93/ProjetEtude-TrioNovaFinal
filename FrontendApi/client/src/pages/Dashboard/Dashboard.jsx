import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import SalesChart from '../../components/charts/SalesChart';
import BasketChart from '../../components/charts/BasketChart';
import CategoryPieChart from '../../components/charts/CategoryPieChart';

function StatCard({ title, value, accent }) {
  return (
    <article className="card p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </article>
  );
}

export default function Dashboard() {
  const [error, setError] = useState('');
  const [salesPeriod, setSalesPeriod] = useState('7d');
  const [basketPeriod, setBasketPeriod] = useState('7d');

  const {
    data,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      setError('');
      const res = await api.get('/admin/dashboard');
      return res.data.data || {};
    },
    staleTime: 1000 * 60 // 1 minute
  });

  const loading = isLoading || isFetching;

  if (loading) return <div className="card p-6">Loading dashboard...</div>;
  if (error) return <div className="card border-red-200 p-6 text-red-600">{error}</div>;

  const sales7d = data?.sales?.last7Days || data?.salesLast7Days || [];
  const sales5w = data?.sales?.last5Weeks || data?.salesLast5Weeks || [];

  const basket7d = data?.basket?.byCategory7Days || data?.basketByCategory7Days || [];
  const basket5w = data?.basket?.byCategory5Weeks || data?.basketByCategory5Weeks || [];

  const categoryDistribution = data?.salesByCategory || data?.categoryDistribution || [];

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={`EUR ${Number(data?.totalRevenue || 0).toFixed(2)}`}
          accent="text-emerald-600"
        />
        <StatCard title="Total Orders" value={data?.totalOrders || 0} accent="text-sky-600" />
        <StatCard
          title="Average Basket"
          value={`EUR ${Number(data?.averageBasket || 0).toFixed(2)}`}
          accent="text-indigo-600"
        />
        <StatCard title="Total Products" value={data?.totalProducts || 0} accent="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <SalesChart
          data7d={sales7d}
          data5w={sales5w}
          period={salesPeriod}
          onChangePeriod={setSalesPeriod}
        />
        <CategoryPieChart data={categoryDistribution} />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <BasketChart
          data7d={basket7d}
          data5w={basket5w}
          period={basketPeriod}
          onChangePeriod={setBasketPeriod}
        />
      </div>
    </section>
  );
}