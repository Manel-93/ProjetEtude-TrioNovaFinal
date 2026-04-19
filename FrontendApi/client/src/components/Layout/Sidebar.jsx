import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ListOrdered,
  TrendingUp,
  Images,
  Mail,
  Users,
  Settings,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { redirectToStorefrontLogin } from '../../utils/storefrontUrl';

const links = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/home-carousel', label: 'Carrousel accueil', icon: Images },
  { to: '/admin/categories', label: 'Catégories', icon: ListOrdered },
  { to: '/admin/products', label: 'Produits', icon: Boxes },
  { to: '/admin/top-products', label: 'Top produits', icon: TrendingUp },
  { to: '/admin/orders', label: 'Commandes', icon: ListOrdered },
  { to: '/admin/billing', label: 'Facturation', icon: Mail },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/chatbot-logs', label: 'Chatbot', icon: MessageCircle }
];

function SidebarLink({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition ${
          isActive ? 'bg-white text-ink' : 'text-slate-200 hover:bg-slate-700'
        }`
      }
      end={to === '/admin/dashboard'}
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      redirectToStorefrontLogin();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col bg-ink text-white transition-transform lg:w-64 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu d'administration"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img
              src="/branding/althea-logo-mobile.png"
              alt=""
              className="h-10 w-10 shrink-0 object-contain lg:hidden"
              width={40}
              height={40}
            />
            <img
              src="/branding/althea-logo-desktop.png"
              alt="Althea Systems"
              className="hidden h-10 w-auto max-w-[min(100%,12rem)] shrink-0 object-contain object-left lg:block"
              height={40}
            />
            <p className="truncate text-[11px] text-slate-400 lg:hidden">Admin</p>
          </div>
          <button className="lg:hidden" onClick={onClose} aria-label="Fermer le menu latéral">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map((link) => (
            <SidebarLink
              key={link.to}
              {...link}
              onNavigate={() => {
                onClose();
              }}
            />
          ))}
        </nav>

        <div className="border-t border-slate-700 p-4 text-xs text-slate-300">
          {user && (
            <div className="mb-3">
              <p className="truncate font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-slate-400">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-slate-600 px-4 py-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}