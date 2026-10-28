import {
  BadgeCheck,
  CircleDot,
  CheckCircle2,
  Hammer,
  Send,
  UserCog,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatDateTime, timeAgo } from '../../lib/format';
import { STATUS_STYLES } from '../../lib/constants';

const STEP_ICONS = {
  submitted: Send,
  acknowledged: CheckCircle2,
  in_progress: Hammer,
  resolved: BadgeCheck,
};

const FLOW = ['submitted', 'acknowledged', 'in_progress', 'resolved'];

/**
 * Horizontal workflow stepper + full chronological audit trail.
 * Read-only: statuses can only be changed by administrators through the API.
 */
export function StatusTimeline({ issue }) {
  const isRejected = issue.status === 'rejected';
  const currentIndex = FLOW.indexOf(issue.status);
  const history = [...(issue.statusHistory || [])].sort(
    (a, b) => new Date(a.changedAt) - new Date(b.changedAt),
  );

  return (
    <div className="space-y-6">
      {isRejected ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-bold text-rose-900">This complaint was rejected</p>
            <p className="mt-1 text-sm leading-relaxed text-rose-700">
              {issue.rejectionReason || 'No reason was recorded by the reviewing officer.'}
            </p>
          </div>
        </div>
      ) : (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FLOW.map((step, index) => {
            const Icon = STEP_ICONS[step];
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const style = STATUS_STYLES[step];

            return (
              <li key={step} className="relative">
                <div
                  className={cn(
                    'flex h-full flex-col gap-2 rounded-2xl border p-3.5 transition',
                    isCurrent
                      ? 'border-primary-300 bg-primary-50/70'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-xl',
                      isCurrent
                        ? 'bg-primary-600 text-white'
                        : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p
                      className={cn(
                        'text-xs font-bold uppercase tracking-wide',
                        isCurrent
                          ? 'text-primary-800'
                          : isDone
                            ? 'text-emerald-700'
                            : 'text-slate-400',
                      )}
                    >
                      {style.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      {isCurrent
                        ? 'Current stage'
                        : isDone
                          ? 'Completed'
                          : 'Pending'}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          <CircleDot className="h-4 w-4 text-primary-500" />
          Activity trail
        </h3>

        <ol className="mt-4 space-y-0">
          {history.map((entry, index) => {
            const style = STATUS_STYLES[entry.status] || STATUS_STYLES.submitted;
            const isLast = index === history.length - 1;
            return (
              <li key={entry._id || `${entry.status}-${index}`} className="relative flex gap-4 pb-6">
                {!isLast && (
                  <span
                    className="absolute left-[11px] top-6 h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full ring-4 ring-white',
                    style.bar,
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>

                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', style.chip)}>
                      {style.label}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {timeAgo(entry.changedAt)}
                    </span>
                  </div>

                  {entry.note && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{entry.note}</p>
                  )}

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <UserCog className="h-3.5 w-3.5" />
                    {entry.changedByName || 'System'} · {formatDateTime(entry.changedAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default StatusTimeline;
