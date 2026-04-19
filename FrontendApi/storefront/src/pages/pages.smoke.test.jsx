import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import HomePage from './HomePage';
import CategoryPage from './CategoryPage';
import SearchPage from './SearchPage';
import ResetPasswordPage from './ResetPasswordPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ContactPage from './ContactPage';
import CheckoutSuccessPage from './CheckoutSuccessPage';
import CheckoutPage from './CheckoutPage';
import CartPage from './CartPage';
import AuthHandoffPage from './AuthHandoffPage';
import AccountProfilePage from './AccountProfilePage';
import AccountPaymentsPage from './AccountPaymentsPage';
import AccountOrdersPage from './AccountOrdersPage';
import AccountOrderDetailPage from './AccountOrderDetailPage';
import AccountLayout from './AccountLayout';
import AccountAddressesPage from './AccountAddressesPage';
import UnitTestsPage from './UnitTestsPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => k
  })
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    const first = Array.isArray(queryKey) ? String(queryKey[0] || '') : String(queryKey || '');

    if (first === 'home-products' || first === 'category-products') {
      return { data: { data: [] }, isLoading: false, error: null, isFetching: false };
    }
    if (first === 'home-carousel' || first === 'home-categories') {
      return { data: [], isLoading: false, error: null, isFetching: false };
    }
    if (first === 'category-meta') {
      return { data: { category: null, sample: null }, isLoading: false, error: null, isFetching: false };
    }
    if (first === 'search') {
      return {
        data: { data: [], pagination: { total: 0, totalPages: 1 }, source: 'mysql' },
        isLoading: false,
        error: null,
        isFetching: false
      };
    }
    if (first === 'search-category-options') {
      return { data: [], isLoading: false, error: null, isFetching: false };
    }
    if (first === 'payment-methods' || first === 'addresses' || first === 'orders') {
      return { data: [], isLoading: false, error: null, isFetching: false };
    }
    if (first === 'order') {
      return { data: null, isLoading: false, error: null, isFetching: false };
    }
    if (first.includes('product') || first === 'similar') {
      return {
        data: {
          data: {
            id: 1,
            name: 'Produit test',
            slug: 'produit-test',
            priceTtc: 99.99,
            stock: 10,
            images: [],
            category: { id: 1, name: 'Diagnostic' }
          }
        },
        isLoading: false,
        error: null,
        isFetching: false
      };
    }
    if (first.includes('cart')) {
      return {
        data: {
          data: {
            items: [],
            summary: { totalTtc: 0, subtotalHt: 0, tvaAmount: 0 }
          }
        },
        isLoading: false,
        error: null,
        isFetching: false
      };
    }

    return {
      data: { data: [] },
      isLoading: false,
      error: null,
      isFetching: false
    };
  },
  useMutation: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(async () => ({ data: { success: true } })),
    isPending: false
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(async () => ({})),
    logout: vi.fn(async () => ({})),
    refreshProfile: vi.fn(async () => ({}))
  })
}));

vi.mock('../api/client', () => ({
  storage: {
    getRemember: vi.fn(() => false),
    setAccess: vi.fn(),
    setRefresh: vi.fn()
  }
}));

vi.mock('../services/products', () => ({
  fetchProducts: vi.fn(async () => ({ data: { data: [] } })),
  fetchProductBySlug: vi.fn(async () => ({
    data: {
      data: {
        id: 1,
        name: 'Produit test',
        slug: 'produit-test',
        priceTtc: 99.99,
        stock: 10,
        images: [],
        category: { id: 1, name: 'Diagnostic' }
      }
    }
  })),
  fetchCategories: vi.fn(async () => ({ data: { data: [] } }))
}));

vi.mock('../services/homeCarousel', () => ({
  fetchHomeCarousel: vi.fn(async () => ({ data: { data: [] } }))
}));

vi.mock('../services/search', () => ({
  searchProducts: vi.fn(async () => ({ data: { data: [] } }))
}));

vi.mock('../services/auth', () => ({
  confirmEmail: vi.fn(async () => ({ data: { success: true } })),
  register: vi.fn(async () => ({ data: { success: true } })),
  forgotPassword: vi.fn(async () => ({ data: { success: true } })),
  resetPassword: vi.fn(async () => ({ data: { success: true } }))
}));

vi.mock('../services/cart', () => ({
  addToCart: vi.fn(async () => ({ data: { success: true } })),
  getCart: vi.fn(async () => ({ data: { data: { items: [] } } })),
  removeFromCart: vi.fn(async () => ({ data: { success: true } })),
  updateCartItem: vi.fn(async () => ({ data: { success: true } })),
  validateCart: vi.fn(async () => ({ data: { success: true } })),
  createPaymentIntent: vi.fn(async () => ({ data: { data: { clientSecret: 'cs_test' } } })),
  finalizePaymentIntent: vi.fn(async () => ({ data: { success: true } }))
}));

vi.mock('../services/contact', () => ({
  sendContact: vi.fn(async () => ({ data: { success: true } })),
  sendChatbotMessage: vi.fn(async () => ({
    data: { data: { sessionId: 's1', reply: 'ok', isEscalated: false } }
  }))
}));

vi.mock('../services/users', () => ({
  updateProfile: vi.fn(async () => ({ data: { success: true } })),
  createAddress: vi.fn(async () => ({ data: { success: true } })),
  getAddresses: vi.fn(async () => ({ data: { data: [] } })),
  updateAddress: vi.fn(async () => ({ data: { success: true } })),
  deleteAddress: vi.fn(async () => ({ data: { success: true } })),
  setDefaultAddress: vi.fn(async () => ({ data: { success: true } })),
  getPaymentMethods: vi.fn(async () => ({ data: { data: [] } })),
  deletePaymentMethod: vi.fn(async () => ({ data: { success: true } })),
  setDefaultPaymentMethod: vi.fn(async () => ({ data: { success: true } }))
}));

vi.mock('../services/orders', () => ({
  getOrders: vi.fn(async () => ({ data: { data: [] } })),
  getOrder: vi.fn(async () => ({ data: { data: null } })),
  downloadInvoicePdf: vi.fn(async () => ({}))
}));

const pages = [
  ['HomePage', HomePage],
  ['CategoryPage', CategoryPage],
  ['SearchPage', SearchPage],
  ['ResetPasswordPage', ResetPasswordPage],
  ['RegisterPage', RegisterPage],
  ['ProductPage', ProductPage],
  ['LoginPage', LoginPage],
  ['ForgotPasswordPage', ForgotPasswordPage],
  ['ContactPage', ContactPage],
  ['CheckoutSuccessPage', CheckoutSuccessPage],
  ['CheckoutPage', CheckoutPage],
  ['CartPage', CartPage],
  ['AuthHandoffPage', AuthHandoffPage],
  ['AccountProfilePage', AccountProfilePage],
  ['AccountPaymentsPage', AccountPaymentsPage],
  ['AccountOrdersPage', AccountOrdersPage],
  ['AccountOrderDetailPage', AccountOrderDetailPage],
  ['AccountLayout', AccountLayout],
  ['AccountAddressesPage', AccountAddressesPage],
  ['UnitTestsPage', UnitTestsPage]
];

describe('Pages smoke tests', () => {
  it.each(pages)('%s render sans crash', (_, PageComponent) => {
    const { container } = render(
      <MemoryRouter>
        <PageComponent />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
