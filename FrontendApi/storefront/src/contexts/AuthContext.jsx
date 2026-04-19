import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { storage } from '../api/client';
import { login as loginApi, logout as logoutApi } from '../services/auth';
import { getProfile } from '../services/users';
import { normalizeUser } from '../utils/user';

const AuthContext = createContext(null);

function mapProfile(raw) {
  if (!raw) return null;
  const u = normalizeUser(raw);
  return {
    ...u,
    addresses: raw.addresses || [],
    paymentMethods: raw.payment_methods || raw.paymentMethods || []
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = storage.getAccess();
    if (!token) {
      setUser(null);
      return null;
    }
    const res = await getProfile();
    const mapped = mapProfile(res.data.data);
    setUser(mapped);
    return mapped;
  }, []);

  useEffect(() => {
    refreshProfile()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = useCallback(
    async (email, password, rememberMe = false) => {
      const guestToken = storage.getGuest();
      const res = await loginApi(email, password, guestToken);
      const { accessToken, refreshToken } = res.data.data;
      storage.setRemember(rememberMe);
      storage.setAccess(accessToken, rememberMe);
      storage.setRefresh(refreshToken, rememberMe);
      const mapped = await refreshProfile();
      return mapped;
    },
    [refreshProfile]
  );

  const logout = useCallback(async () => {
    const rt = storage.getRefresh();
    try {
      if (rt) await logoutApi(rt);
    } catch {
      /* ignore */
    }
    storage.clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshProfile,
      isAuthenticated: !!user
    }),
    [user, loading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
