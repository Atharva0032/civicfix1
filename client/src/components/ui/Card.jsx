import { cn } from '../../lib/cn';

export function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component className={cn('surface', className)} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, action, icon: Icon, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
            <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-navy-900">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

/** Headline metric tile used by both dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  isLoading = false,
  className,
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700',
    accent: 'bg-accent-50 text-accent-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <Card className={cn('p-5 transition-shadow hover:shadow-card-hover', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          {isLoading ? (
            <div className="skeleton mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1.5 font-display text-3xl font-extrabold leading-none text-navy-900">
              {value}
            </p>
          )}
          {hint && !isLoading && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
              tones[tone] || tones.primary,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </Card>
  );
}

export default Card;
