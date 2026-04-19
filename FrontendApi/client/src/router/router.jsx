import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from '../App';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/Layout/AdminLayout';
import AdminAuthHandoff from '../pages/Auth/AdminAuthHandoff';
import RedirectToStorefrontLogin from '../pages/Auth/RedirectToStorefrontLogin';
import Dashboard from '../pages/Dashboard/Dashboard';
import ProductsList from '../pages/Products/ProductsList';
import ProductDetails from '../pages/Products/ProductDetails';
import ProductCreate from '../pages/Products/ProductCreate';
import ProductEdit from '../pages/Products/ProductEdit';
import CategoryListPage from '../pages/Categories/CategoryListPage';
import OrderListPage from '../pages/Orders/OrderListPage';
import OrderDetailPage from '../pages/Orders/OrderDetailPage';
import ContactMessagesPage from '../pages/Messages/ContactMessagesPage';
import UsersListPage from '../pages/Users/UsersListPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import ChatbotLogsPage from '../pages/Chatbot/ChatbotLogsPage';
import TopProductsPage from '../pages/TopProducts/TopProductsPage';
import HomeCarouselPage from '../pages/HomeCarousel/HomeCarouselPage';
import BillingPage from '../pages/Billing/BillingPage';

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/auth/handoff', element: <AdminAuthHandoff /> },
      { path: '/login', element: <RedirectToStorefrontLogin /> },
      {
        path: '/admin',
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'home-carousel', element: <HomeCarouselPage /> },
          { path: 'products', element: <ProductsList /> },
          { path: 'products/new', element: <ProductCreate /> },
          { path: 'products/:id', element: <ProductDetails /> },
          { path: 'products/:id/edit', element: <ProductEdit /> },
          { path: 'top-products', element: <TopProductsPage /> },
          { path: 'categories', element: <CategoryListPage /> },
          { path: 'orders', element: <OrderListPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'billing', element: <BillingPage /> },
          { path: 'messages', element: <ContactMessagesPage /> },
          { path: 'users', element: <UsersListPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'chatbot-logs', element: <ChatbotLogsPage /> }
        ]
      },
      { path: '*', element: <RedirectToStorefrontLogin /> }
    ]
  }
]);

export default router;