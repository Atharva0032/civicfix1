import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Button, Card, ErrorState, Skeleton, StatCard } from '../../components/ui';
import {
  NotificationEmpty,
  NotificationRow,
} from '../../components/notifications/NotificationList';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../context/NotificationContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatNumber } from '../../lib/format';
import { cn } from '../../lib/cn';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

export default function NotificationsPage() {
  useDocumentTitle('Notifications');

  const { unread, markRead, markAllRead, remove, refresh } = useNotifications();
  const { data, meta, isLoading, error, refetch } = useApi('/notifications', {
    params: { limit: 50 },
  });

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (Array.isArray(data)) setItems(data);
  }, [data]);

  const total = meta?.total ?? items.length;
  const unreadCount = Math.max(unread, items.filter((item) => !item.read).length);
  const visible = activeTab === 'unread' ? items.filter((item) => !item.read) : items;

  const handleRead = async (notification) => {
    if (notification.read) return;
    setItems((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    try {
      await markRead(notification.id);
    } finally {
      refresh();
    }
  };

  const handleDelete = async (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await remove(id);
    } finally {
      refresh();
    }
  };

  const handleMarkAll = async () => {
    if (!items.some((item) => !item.read)) return;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await markAllRead();
    } finally {
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            Status changes and notes on the complaints you follow.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={CheckCheck}
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
          className="w-full sm:w-auto"
        >
          Mark all as read
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total notifications"
          value={formatNumber(total)}
          hint="Everything you have received"
          icon={Inbox}
          tone="primary"
          isLoading={isLoading}
        />
        <StatCard
          label="Unread"
          value={formatNumber(unreadCount)}
          hint="Waiting for your attention"
          icon={Bell}
          tone="rose"
          isLoading={isLoading}
        />
      </div>

      <div className="surface flex w-fit gap-1.5 p-1.5" role="tablist" aria-label="Notification filter">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`notif-tab-${tab.value}`}
            aria-selected={activeTab === tab.value}
            aria-controls="notif-panel"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              activeTab === tab.value
                ? 'bg-primary-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 && (
              <span
                className={cn(
                  'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold',
                  activeTab === 'unread' ? 'bg-white/20 text-white' : 'bg-rose-500 text-white',
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div id="notif-panel" role="tabpanel" aria-labelledby={`notif-tab-${activeTab}`}>
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorState
                title="We could not load your notifications"
                message={error.message}
                onRetry={refetch}
              />
            </div>
          ) : visible.length === 0 ? (
            <NotificationEmpty />
          ) : (
            <div className="divide-y divide-slate-100">
              {visible.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
