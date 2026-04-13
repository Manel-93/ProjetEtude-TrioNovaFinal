export default function BulkActions({ selectedCount, onDeleteSelected, onClearSelection, deleting }) {
  if (selectedCount === 0) return null;

  return (
    <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-700">
        {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={onClearSelection} disabled={deleting}>
          Effacer la sélection
        </button>
        <button
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          onClick={onDeleteSelected}
          disabled={deleting}
        >
          Supprimer la sélection
        </button>
      </div>
    </div>
  );
}
