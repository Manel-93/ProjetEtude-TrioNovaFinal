import { NavLink } from 'react-router-dom';
import { Boxes, Images, LayoutDashboard, ListOrdered, Mail, TrendingUp, Users, Settings, MessageCircle } from 'lucide-react';

const links = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/home-carousel', label: 'Carrousel', icon: Images },
  { to: '/admin/categories', label: 'Catégories', icon: ListOrdered },
  { to: '/admin/products', label: 'Produits', icon: Boxes },
  { to: '/admin/top-products', label: 'Top', icon: TrendingUp },
  { to: '/admin/orders', label: 'Commandes', icon: ListOrdered },
  { to: '/admin/billing', label: 'Facturation', icon: Mail },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/chatbot-logs', label: 'Chatbot', icon: MessageCircle }
];

export default function AdminNavbar() {
  return (
    <nav
      className="sticky top-14 z-30 border-b border-slate-200 bg-white/70 backdrop-blur lg:hidden"
      aria-label="Navigation administration"
    >
      <div className="flex overflow-x-auto gap-2 px-4 py-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin/dashboard'}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isActive ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

