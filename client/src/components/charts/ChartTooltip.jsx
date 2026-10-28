import { cn } from '../../lib/cn';

/** Shared Recharts tooltip so every chart in the dashboards looks identical. */
export function ChartTooltip({ active, payload, label, labelFormatter, valueSuffix = '' }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card-hover">
      {label !== undefined && (
        <p className="text-xs font-bold text-navy-900">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
            />
            <span className="text-slate-500">{entry.name}</span>
            <span className="font-bold text-navy-900">
              {entry.value}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Recharts wraps tick text; this keeps long department names readable. */
export function truncateTick(value, length = 18) {
  const text = String(value ?? '');
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function ChartShell({ height = 280, isLoading, isEmpty, emptyLabel, children, className }) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="skeleton h-full w-full rounded-xl" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 text-slate-400',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm font-medium">{emptyLabel || 'Not enough data yet.'}</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      {children}
    </div>
  );
}

export default ChartTooltip;
