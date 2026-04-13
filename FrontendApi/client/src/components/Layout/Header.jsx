import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { redirectToStorefrontLogin } from '../../utils/storefrontUrl';

export default function Header({ title, onToggleSidebar }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      redirectToStorefrontLogin();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:pl-6 md:pr-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu de navigation"
        >
          <span className="sr-only">Ouvrir le menu</span>
          <div className="space-y-1">
            <span className="block h-0.5 w-4 rounded-full bg-slate-700" />
            <span className="block h-0.5 w-4 rounded-full bg-slate-700" />
            <span className="block h-0.5 w-4 rounded-full bg-slate-700" />
          </div>
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/branding/althea-logo-mobile.png"
            alt=""
            className="h-9 w-9 shrink-0 object-contain md:hidden"
            width={36}
            height={36}
          />
          <img
            src="/branding/althea-logo-desktop.png"
            alt="Althea Systems"
            className="hidden h-9 w-auto max-w-[220px] shrink-0 object-contain object-left md:block"
            height={36}
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-ink md:text-xl" aria-live="polite">
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink/80 shadow-sm hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean sm:inline-flex"
        >
          <User className="h-4 w-4" aria-hidden="true" />
          <span>Administrateur</span>
        </button>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ocean text-white shadow-sm hover:bg-ocean-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/50"
          aria-label="Se déconnecter"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

