import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ShoppingCart, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCart } from '../../services/cart';
import { useAuth } from '../../contexts/AuthContext';

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`;

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const { data: cartRes } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await getCart();
      return res.data.data;
    },
    refetchInterval: 60 * 1000
  });

  const count = cartRes?.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;

  const submitSearch = (e) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    navigate(`/recherche?q=${encodeURIComponent(v)}`);
    setOpen(false);
  };

  const langs = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' }
  ];

  const doLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 lg:px-8">
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">{t('header.openMenu')}</span>
        </button>

        <Link to="/" className="flex shrink-0 items-center">
          <img
            src="/branding/logo-mobile.png"
            alt=""
            className="h-9 w-9 shrink-0 object-contain md:hidden"
            width={36}
            height={36}
          />
          <img
            src="/branding/logo-desktop.png"
            alt="AltheaSystems"
            className="hidden h-10 w-auto max-h-11 object-contain object-left md:block"
            height={44}
          />
        </Link>

        <form
          onSubmit={submitSearch}
          className="min-w-0 flex-1 px-1 sm:px-2"
        >
          <label htmlFor="global-search" className="sr-only">
            {t('header.searchPlaceholder')}
          </label>
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <input
              id="global-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              className="w-full border-0 bg-transparent py-2.5 pl-2 pr-1 text-base text-slate-700 outline-none placeholder:text-slate-400"
              autoComplete="off"
            />
            </div>
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 lg:flex" role="group" aria-label={t('common.lang')}>
            {langs.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => i18n.changeLanguage(l.code)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  i18n.language.startsWith(l.code) ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <Link
            to="/panier"
            className="relative rounded-xl p-2 text-slate-700 hover:bg-slate-100"
            aria-label={t('header.cartAria')}
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 ? (
              <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ocean px-1 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-2 md:flex">
              <Link
                to="/compte"
                className="whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {t('nav.account')}
              </Link>
              <button
                type="button"
                className="whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={doLogout}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link
              to="/connexion"
              className="hidden whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 md:inline-block"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>

      <nav
        className={`border-t border-slate-100 bg-white/95 px-4 py-2 ${open ? 'block' : 'hidden md:block'}`}
        id="mobile-nav"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-1 md:flex-row md:items-center md:gap-2">
          <NavLink to="/" end className={navClass} onClick={() => setOpen(false)}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/recherche" className={navClass} onClick={() => setOpen(false)}>
            {t('nav.catalog')}
          </NavLink>
          <NavLink to="/outils" className={navClass} onClick={() => setOpen(false)}>
            {t('nav.contact')}
          </NavLink>
          {user ? (
            <>
              <NavLink to="/compte" className={(p) => `${navClass(p)} md:hidden`} onClick={() => setOpen(false)}>
                {t('nav.account')}
              </NavLink>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 md:hidden"
                onClick={doLogout}
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <NavLink to="/connexion" className={navClass} onClick={() => setOpen(false)}>
              {t('nav.login')}
            </NavLink>
          )}
          <div className="flex gap-1 border-t border-slate-100 pt-2 lg:hidden">
            {langs.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => i18n.changeLanguage(l.code)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  i18n.language.startsWith(l.code) ? 'bg-ink text-white' : 'bg-slate-100'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
