import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationEmpty, NotificationRow } from '../notifications/NotificationList';
import { Button } from '../ui/Button';

/**
 * Navbar notification bell with an unread badge and a quick-glance dropdown.
 * The list is polled by NotificationProvider, so the badge stays accurate.
 */
export function NotificationBell({ align = 'right' }) {
  const { items, unread, isLoading, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const visible = items.slice(0, 6);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
        }
        className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy-900"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-navy-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {unread > 0 ? `${unread} unread` : 'You are all caught up'}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 transition hover:text-primary-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="scrollbar-thin max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {isLoading && !visible.length ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="skeleton h-9 w-9 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3.5 w-2/3" />
                      <div className="skeleton h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visible.length ? (
              visible.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  compact
                  onRead={(item) => {
                    if (!item.read) markRead(item.id);
                    setIsOpen(false);
                  }}
                />
              ))
            ) : (
              <NotificationEmpty compact />
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            <Button as={Link} to="/dashboard/notifications" variant="ghost" size="sm" className="w-full">
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
