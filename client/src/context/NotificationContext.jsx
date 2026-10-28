import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 60_000;

/**
 * Single source of truth for notifications: the navbar bell, the citizen
 * dashboard and the notifications page all read from here so the unread badge
 * can never drift out of sync.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(
    async ({ limit = 8, unreadOnly = false } = {}) => {
      if (!isAuthenticated) {
        setItems([]);
        setUnread(0);
        setMeta(null);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await api.get('/notifications', {
          params: { limit, unreadOnly: unreadOnly ? 'true' : undefined },
        });
        setItems(data.data);
        setMeta(data.meta);
        setUnread(data.meta?.unread ?? 0);
      } catch {
        /* silently ignore — the bell simply keeps its previous state */
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnread(0);
      return undefined;
    }

    refresh();
    const timer = window.setInterval(() => refresh(), POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (id) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    setUnread((current) => Math.max(0, current - 1));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      /* the optimistic update is corrected on the next poll */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
    try {
      await api.patch('/notifications/read-all');
    } catch {
      /* noop */
    }
  }, []);

  const remove = useCallback(async (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo(
    () => ({ items, unread, meta, isLoading, refresh, markRead, markAllRead, remove }),
    [items, unread, meta, isLoading, refresh, markRead, markAllRead, remove],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside <NotificationProvider>.');
  }
  return context;
}

export default NotificationContext;
