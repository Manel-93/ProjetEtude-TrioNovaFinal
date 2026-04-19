import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as loginApi, logout as logoutApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password, twoFactorToken) => {
    const res = await loginApi(email, password, twoFactorToken);
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('admin_access_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  /** Met à jour l’utilisateur admin en mémoire (ex. profil complet après GET /users/me). */
  const setUserData = useCallback((next) => {
    setUser(next);
    if (next) {
      localStorage.setItem('admin_user', JSON.stringify(next));
    } else {
      localStorage.removeItem('admin_user');
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    if (refreshToken) {
      logoutApi(refreshToken).catch(() => {
        /* révoquer côté serveur : best-effort */
      });
    }
  }, []);

  const isAuthenticated = !!localStorage.getItem('admin_access_token');

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
