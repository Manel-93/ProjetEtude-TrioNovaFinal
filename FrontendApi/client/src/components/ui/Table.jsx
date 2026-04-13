export default function Table({ columns = [], children, caption }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
      <table className="min-w-full text-left text-sm text-slate-700">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.accessor} scope="col" className="px-4 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

