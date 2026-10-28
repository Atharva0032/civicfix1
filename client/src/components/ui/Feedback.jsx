import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary-600', className)} />;
}

/** Full-page loading state used while a route's data resolves. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

/** Card-shaped skeleton used for complaint lists while loading. */
export function IssueCardSkeleton() {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2.5 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-5 flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-4', columnIndex === 0 ? 'w-40' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 text-base font-bold text-navy-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'We could not load this',
  message,
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-rose-500 shadow-sm">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-rose-900">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-rose-700">{message}</p>}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          leftIcon={RefreshCw}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
