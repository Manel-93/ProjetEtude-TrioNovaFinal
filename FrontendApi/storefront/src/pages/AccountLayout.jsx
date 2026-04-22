import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const link = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function AccountLayout() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row">
      <aside className="card h-fit w-full shrink-0 p-4 md:w-56">
        <nav className="flex flex-col gap-1">
          <NavLink to="/compte" end className={link}>
            {t('account.profile')}
          </NavLink>
          <NavLink to="/compte/adresses" className={link}>
            {t('account.addresses')}
          </NavLink>
          <NavLink to="/compte/paiements" className={link}>
            {t('account.payments')}
          </NavLink>
          <NavLink to="/compte/commandes" className={link}>
            {t('account.orders')}
          </NavLink>
          <NavLink to="/compte/avoirs" className={link}>
            Avoirs
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
