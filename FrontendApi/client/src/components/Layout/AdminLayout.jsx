import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import PageContainer from './PageContainer';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);

  const getTitle = () => {
    if (location.pathname.startsWith('/admin/products')) return 'Produits';
    if (location.pathname.startsWith('/admin/top-products')) return 'Top produits';
    if (location.pathname.startsWith('/admin/home-carousel')) return 'Carrousel accueil';
    if (location.pathname.startsWith('/admin/categories')) return 'Catégories';
    if (location.pathname.startsWith('/admin/orders')) return 'Commandes';
    if (location.pathname.startsWith('/admin/billing')) return 'Facturation';
    if (location.pathname.startsWith('/admin/messages')) return 'Messages';
    if (location.pathname.startsWith('/admin/users')) return 'Utilisateurs';
    if (location.pathname.startsWith('/admin/settings')) return 'Paramètre';
    return 'Tableau de bord';
  };

  return (
    <div className="min-h-screen bg-surface/50 text-slate-800">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header title={getTitle()} onToggleSidebar={toggleSidebar} />
        <AdminNavbar />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}

