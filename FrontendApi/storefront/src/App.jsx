import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import SearchPage from './pages/SearchPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountLayout from './pages/AccountLayout';
import AccountProfilePage from './pages/AccountProfilePage';
import AccountAddressesPage from './pages/AccountAddressesPage';
import AccountPaymentsPage from './pages/AccountPaymentsPage';
import AccountOrdersPage from './pages/AccountOrdersPage';
import AccountOrderDetailPage from './pages/AccountOrderDetailPage';
import ContactPage from './pages/ContactPage';
import AuthHandoffPage from './pages/AuthHandoffPage';
import UnitTestsPage from './pages/UnitTestsPage';
import { LegalNoticePage, PrivacyPolicyPage, TermsSalesPage } from './pages/LegalPages';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/auth/transfert" element={<AuthHandoffPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogue/:categoryId" element={<CategoryPage />} />
        <Route path="/produit/:slug" element={<ProductPage />} />
        <Route path="/recherche" element={<SearchPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/caisse" element={<CheckoutPage />} />
        <Route path="/caisse/succes" element={<CheckoutSuccessPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
        <Route path="/outils" element={<ContactPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tests-unitaires" element={<UnitTestsPage />} />
        <Route path="/mentions-legales" element={<LegalNoticePage />} />
        <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
        <Route path="/cgv" element={<TermsSalesPage />} />

        <Route
          path="/compte"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountProfilePage />} />
          <Route path="adresses" element={<AccountAddressesPage />} />
          <Route path="paiements" element={<AccountPaymentsPage />} />
          <Route path="commandes" element={<AccountOrdersPage />} />
          <Route path="commandes/:id" element={<AccountOrderDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
