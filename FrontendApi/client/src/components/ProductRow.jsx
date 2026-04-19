import { Link } from 'react-router-dom';
import ProductThumb from './ProductThumb';

export default function ProductRow({ product, selected, onToggle, onRequestDelete }) {
  const isAvailable = Number(product.stock || 0) > 0;
  const primaryImage =
    (Array.isArray(product.images) && (product.images.find((img) => img?.isPrimary) || product.images[0])) || null;
  const imageUrl = primaryImage?.url || '';

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-3 py-3 sm:px-4">
        <input type="checkbox" checked={selected} onChange={() => onToggle(product.id)} className="h-4 w-4 rounded border-slate-300" />
      </td>
      <td className="px-3 py-3 text-sm font-medium text-slate-800 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProductThumb url={imageUrl} alt="" />
          <span className="min-w-0 truncate whitespace-nowrap">{product.name}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700 sm:px-4">EUR {Number(product.priceHt || 0).toFixed(2)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700 sm:px-4">{Number(product.tva || 0).toFixed(2)} %</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700 sm:px-4">EUR {Number(product.priceTtc || 0).toFixed(2)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600 sm:px-4">{product.categoryId ?? '-'}</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700 sm:px-4">{product.stock}</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm sm:px-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isAvailable ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
          }`}
        >
          {isAvailable ? 'Disponible' : 'Rupture de stock'}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm sm:px-4">
        <div className="flex flex-nowrap items-center gap-2">
          <Link
            className="btn-secondary shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
            to={`/admin/products/${product.id}`}
          >
            Voir
          </Link>
          <Link
            className="btn-secondary shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
            to={`/admin/products/${product.id}/edit`}
          >
            Modifier
          </Link>
          <button
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/15"
            onClick={() => onRequestDelete(product.id)}
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}
