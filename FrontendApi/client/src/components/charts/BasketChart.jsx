import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const periodOptions = [
  { id: '7d', label: 'Last 7 days' },
  { id: '5w', label: 'Last 5 weeks' }
];

export default function BasketChart({ data7d = [], data5w = [], period, onChangePeriod }) {
  const data = period === '5w' ? data5w : data7d;

  return (
    <section className="card flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Average basket by category</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Average order value per category for the selected period.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs sm:text-sm">
          {periodOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangePeriod(opt.id)}
              className={`rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 font-medium ${
                period === opt.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <div className="h-64 sm:h-72">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">
            No basket data available for this period.
          </p>
        )}
      </div>
    </section>
  );
}

