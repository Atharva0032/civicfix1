import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BellRing,
  CheckCircle2,
  Hammer,
  Info,
  Send,
  StickyNote,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/format';

const TYPE_STYLES = {
  submission: { icon: Send, tone: 'bg-primary-50 text-primary-600' },
  acknowledged: { icon: CheckCircle2, tone: 'bg-sky-50 text-sky-600' },
  in_progress: { icon: Hammer, tone: 'bg-amber-50 text-amber-600' },
  resolved: { icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600' },
  rejected: { icon: XCircle, tone: 'bg-rose-50 text-rose-600' },
  note: { icon: StickyNote, tone: 'bg-slate-100 text-slate-600' },
  system: { icon: Info, tone: 'bg-primary-50 text-primary-600' },
};

/** One notification row — shared by the bell dropdown and the full page. */
export function NotificationRow({ notification, onRead, onDelete, compact = false }) {
  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.system;
  const Icon = style.icon;
  const isUnread = !notification.read;

  const content = (
    <>
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
          style.tone,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm text-navy-900',
              isUnread ? 'font-bold' : 'font-semibold',
            )}
          >
            {notification.title}
          </span>
          <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-400">
            {timeAgo(notification.createdAt)}
          </span>
        </span>
        <span
          className={cn(
            'mt-0.5 block text-sm leading-relaxed text-slate-500',
            compact ? 'line-clamp-2' : '',
          )}
        >
          {notification.message}
        </span>
        {notification.issueComplaintId && (
          <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
            {notification.issueComplaintId}
          </span>
        )}
      </span>
    </>
  );

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-3.5 transition',
        isUnread ? 'bg-primary-50/40' : 'bg-white',
        'hover:bg-slate-50',
      )}
    >
      {notification.issue ? (
        <Link
          to={`/issues/${notification.issue}`}
          onClick={() => onRead?.(notification)}
          className="flex min-w-0 flex-1 gap-3"
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onRead?.(notification)}
          className="flex min-w-0 flex-1 gap-3 text-left"
        >
          {content}
        </button>
      )}

      <span className="absolute right-3 top-3 flex items-center gap-1">
        {isUnread && !compact && (
          <span
            className="h-2 w-2 rounded-full bg-primary-600"
            aria-label="Unread notification"
          />
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(notification.id);
            }}
            aria-label="Delete notification"
            className="rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-500 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </span>
    </div>
  );
}

export const NotificationEmpty = ({ compact = false }) => (
  <div className={cn('px-4 text-center', compact ? 'py-8' : 'py-16')}>
    <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-400">
      <BellRing className="h-5 w-5" />
    </span>
    <p className="mt-3 text-sm font-semibold text-navy-900">No notifications yet</p>
    <p className="mt-1 text-sm text-slate-500">
      Status updates on your complaints will appear here.
    </p>
  </div>
);

export default NotificationRow;
