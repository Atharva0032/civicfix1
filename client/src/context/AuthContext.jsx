import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, { tokenStore, UNAUTHORIZED_EVENT } from '../lib/api';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user. The JWT lives in localStorage, but the role and
 * profile always come from `GET /api/auth/me` so a tampered client cannot
 * pretend to be an administrator.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setStatus('anonymous');
      return null;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      setStatus('authenticated');
      return data.data.user;
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus('anonymous');
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The API client fires this when a token expires mid-session.
  useEffect(() => {
    const handle = () => {
      setUser(null);
      setStatus('anonymous');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handle);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handle);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    tokenStore.set(data.data.token);
    setUser(data.data.user);
    setStatus('authenticated');
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    tokenStore.set(data.data.token);
    setUser(data.data.user);
    setStatus('authenticated');
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* stateless JWT — a failed call must never block signing out */
    }
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((current) => (current ? { ...current, ...partial } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
      updateUser,
    }),
    [user, status, login, register, logout, refresh, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}

export default AuthContext;
