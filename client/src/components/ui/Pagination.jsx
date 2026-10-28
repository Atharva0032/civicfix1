import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { formatNumber } from '../../lib/format';

/** Windowed page numbers with ellipses, e.g. 1 … 4 5 6 … 20 */
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const output = [];
  let previous = 0;
  sorted.forEach((page) => {
    if (previous && page - previous > 1) output.push('…');
    output.push(page);
    previous = page;
  });
  return output;
}

export function Pagination({ meta, onPageChange, className }) {
  if (!meta || meta.totalPages <= 1) {
    return meta?.total ? (
      <p className={cn('text-sm text-slate-500', className)}>
        {formatNumber(meta.total)} result{meta.total === 1 ? '' : 's'}
      </p>
    ) : null;
  }

  const { page, totalPages, total } = meta;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}
    >
      <p className="text-sm text-slate-500">
        Showing page <span className="font-semibold text-navy-800">{page}</span> of{' '}
        <span className="font-semibold text-navy-800">{totalPages}</span> ·{' '}
        {formatNumber(total)} total
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageWindow(page, totalPages).map((entry, index) =>
          entry === '…' ? (
            <span key={`gap-${index}`} className="px-1.5 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition',
                entry === page
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'border border-slate-300 bg-white text-navy-800 hover:bg-slate-50',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNextPage}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

export default Pagination;
