import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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

  const categoryDistribution = data?.salesByCategory || [];
  const sales7Days = data?.salesLast7Days || [];
  const kpis = data?.kpis || {};

  const pieData = {
    labels: categoryDistribution.map((entry) => entry.categoryName || 'Sans categorie'),
    datasets: [
      {
        data: categoryDistribution.map((entry) => Number(entry.totalRevenue || 0)),
        backgroundColor: ['#14b8a6', '#60a5fa', '#f59e0b', '#a78bfa', '#34d399', '#f87171']
      }
    ]
  };
  const barData = {
    labels: sales7Days.map((entry) => entry.label),
    datasets: [
      {
        label: 'Ventes EUR',
        data: sales7Days.map((entry) => Number(entry.value || 0)),
        backgroundColor: '#38bdf8'
      }
    ]
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="CA mensuel"
          value={`EUR ${Number(kpis.revenue || 0).toFixed(2)}`}
          accent="text-emerald-600"
        />
        <StatCard title="Commandes" value={kpis.orders || 0} accent="text-sky-600" />
        <StatCard
          title="Alertes stock"
          value={kpis.stockAlerts || 0}
          accent="text-amber-600"
        />
        <StatCard title="Messages non traites" value={kpis.unresolvedMessages || 0} accent="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <section className="card p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Histogramme des ventes - 7 jours</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Evolution quotidienne du chiffre d'affaires.</p>
          <div className="mt-4 h-72">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Repartition ventes par categorie</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Graphique camembert des ventes en EUR.</p>
          <div className="mt-4 h-72">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </section>
      </div>
    </section>
  );
}