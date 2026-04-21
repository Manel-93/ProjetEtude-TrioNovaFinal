import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import LoginPage from './LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

const { authState, storageState } = vi.hoisted(() => ({
  authState: {
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn()
  },
  storageState: {
    getRemember: vi.fn(() => false),
    getAccess: vi.fn(() => 'access-token'),
    getRefresh: vi.fn(() => 'refresh-token'),
    setAccess: vi.fn(),
    setRefresh: vi.fn(),
    clearAuth: vi.fn()
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

vi.mock('lucide-react', () => ({
  Eye: () => <span>eye</span>,
  EyeOff: () => <span>eye-off</span>
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState
}));

vi.mock('../api/client', () => ({
  storage: storageState
}));

vi.mock('../services/auth', () => ({
  confirmEmail: vi.fn(async () => ({ data: { success: true } }))
}));

function LoginLocationState() {
  const location = useLocation();
  return (
    <div>
      Login
      <span data-testid="from-path">{location.state?.from?.pathname || ''}</span>
      <span data-testid="from-search">{location.state?.from?.search || ''}</span>
    </div>
  );
}

describe("Flux d'authentification", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.login = vi.fn(async () => ({ role: 'USER' }));
    storageState.getRemember.mockReturnValue(false);
    storageState.getAccess.mockReturnValue('access-token');
    storageState.getRefresh.mockReturnValue('refresh-token');
    storageState.clearAuth.mockReset();
  });

  it('redirige vers la connexion avec la page privée mémorisée', () => {
    render(
      <MemoryRouter initialEntries={['/compte/commandes?filtre=1']}>
        <Routes>
          <Route path="/connexion" element={<LoginLocationState />} />
          <Route
            path="/compte/commandes"
            element={
              <ProtectedRoute>
                <div>Zone privée</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByTestId('from-path').textContent).toBe('/compte/commandes');
    expect(screen.getByTestId('from-search').textContent).toBe('?filtre=1');
  });

  it('renvoie vers la page privée après connexion et transmet remember me', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/connexion',
            state: {
              from: {
                pathname: '/compte/commandes',
                search: '?filtre=1',
                hash: '#top'
              }
            }
          }
        ]}
      >
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/compte/commandes" element={<div>Commandes privées</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'client@test.fr' }
    });
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'MotDePasse123!' }
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'auth.rememberMe' }));
    fireEvent.click(screen.getByRole('button', { name: 'auth.submitLogin' }));

    await waitFor(() => {
      expect(screen.getByText('Commandes privées')).toBeTruthy();
    });

    expect(authState.login).toHaveBeenCalledWith('client@test.fr', 'MotDePasse123!', true);
  });

  it('propose la réinitialisation quand les identifiants sont refusés', async () => {
    authState.login = vi.fn(async () => {
      throw new Error('Email ou mot de passe incorrect');
    });

    render(
      <MemoryRouter initialEntries={['/connexion']}>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'client@test.fr' }
    });
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'mauvais' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'auth.submitLogin' }));

    await waitFor(() => {
      expect(screen.getByText('auth.wrongPasswordHint')).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: 'auth.resetPasswordLink' })).toBeTruthy();
  });
});
