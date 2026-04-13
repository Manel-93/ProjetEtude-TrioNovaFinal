import { useLocation } from 'react-router-dom';

function getTitle(pathname) {
  if (pathname.includes('/admin/products/') && pathname.endsWith('/edit')) return 'Modifier le produit';
  if (pathname.includes('/admin/products/new')) return 'Créer un produit';
  if (pathname.match(/\/admin\/products\/\d+$/)) return 'Détail du produit';
  if (pathname.includes('/admin/products')) return 'Produits';
  return 'Tableau de bord';
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xl leading-none lg:hidden"
        aria-label="Open menu"
      >
        &#9776;
      </button>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400">Administration</p>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>
    </header>
  );
}