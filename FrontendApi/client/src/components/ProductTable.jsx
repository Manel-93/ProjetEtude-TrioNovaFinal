import ProductRow from './ProductRow';

function SortHeader({ label, column, sortBy, sortDir, onSort }) {
  const active = sortBy === column;
  const arrow = !active ? '↕' : sortDir === 'asc' ? '↑' : '↓';

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
    >
      <span>{label}</span>
      <span className={active ? 'text-slate-800' : 'text-slate-300'}>{arrow}</span>
    </button>
  );
}

export default function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRequestDelete,
  sortBy,
  sortDir,
  onSort
}) {
  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-3 py-3 sm:px-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="Nom" column="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="Prix HT" column="priceHt" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="TVA" column="tva" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="Prix TTC" column="priceTtc" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="Catégorie" column="category" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="Stock" column="stock" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 sm:px-4">
                <SortHeader label="Statut" column="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                selected={selectedIds.has(product.id)}
                onToggle={onToggleSelect}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
