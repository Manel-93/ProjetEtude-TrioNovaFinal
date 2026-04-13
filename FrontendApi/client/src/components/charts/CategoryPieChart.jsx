import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';

const COLORS = ['#0f766e', '#2563eb', '#f97316', '#7c3aed', '#ec4899', '#22c55e', '#eab308'];

export default function CategoryPieChart({ data = [] }) {
  return (
    <section className="card flex flex-col gap-4 p-4 sm:p-6">
      <header>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Sales by category</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Distribution of sales volume across product categories.
        </p>
      </header>

      <div className="h-64 sm:h-72">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={`slice-${entry.category}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value, 'Sales']}
                contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">
            No category distribution data available.
          </p>
        )}
      </div>
    </section>
  );
}

