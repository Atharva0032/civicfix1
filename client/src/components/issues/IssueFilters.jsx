import { useEffect, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button, Input, Select } from '../ui';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useMeta } from '../../context/MetaContext';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'supporters:desc', label: 'Most supported' },
  { value: 'priority:desc', label: 'Highest priority' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
];

export const EMPTY_FILTERS = {
  search: '',
  category: '',
  status: '',
  priority: '',
  sort: 'createdAt:desc',
  from: '',
  to: '',
  mine: false,
};

/**
 * Controlled filter bar used by Explore, My Reports and the admin complaints
 * table. `onChange` receives the complete filter object.
 */
export function IssueFilters({
  value,
  onChange,
  total,
  showDateRange = false,
  showMineToggle = false,
  showSort = true,
  className,
  children,
}) {
  const { categories, statuses, priorities } = useMeta();
  const [searchText, setSearchText] = useState(value.search || '');
  const debouncedSearch = useDebouncedValue(searchText, 400);
  const [isExpanded, setIsExpanded] = useState(false);

  // Push the debounced search term up so we do not fire a request per keystroke.
  useEffect(() => {
    if (debouncedSearch !== value.search) {
      onChange({ ...value, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const update = (patch) => onChange({ ...value, ...patch });

  const activeCount = [
    value.search,
    value.category,
    value.status,
    value.priority,
    showDateRange && value.from,
    showDateRange && value.to,
    showMineToggle && value.mine,
  ].filter(Boolean).length;

  const reset = () => {
    setSearchText('');
    onChange({ ...EMPTY_FILTERS, sort: value.sort });
  };

  return (
    <div className={cn('surface p-4', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by title, address or complaint ID…"
            aria-label="Search complaints"
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={value.category}
            onChange={(event) => update({ category: event.target.value })}
            aria-label="Filter by category"
            className="w-auto min-w-40"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>

          <Select
            value={value.status}
            onChange={(event) => update({ status: event.target.value })}
            aria-label="Filter by status"
            className="w-auto min-w-36"
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            size="md"
            leftIcon={SlidersHorizontal}
            onClick={() => setIsExpanded((open) => !open)}
            aria-expanded={isExpanded}
          >
            More
            {activeCount > 0 && (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="field-label" htmlFor="filter-priority">
              Priority
            </label>
            <Select
              id="filter-priority"
              value={value.priority}
              onChange={(event) => update({ priority: event.target.value })}
            >
              <option value="">Any priority</option>
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </div>

          {showSort && (
            <div>
              <label className="field-label" htmlFor="filter-sort">
                Sort by
              </label>
              <Select
                id="filter-sort"
                value={value.sort}
                onChange={(event) => update({ sort: event.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {showDateRange && (
            <>
              <div>
                <label className="field-label" htmlFor="filter-from">
                  Reported from
                </label>
                <Input
                  id="filter-from"
                  type="date"
                  value={value.from}
                  onChange={(event) => update({ from: event.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="filter-to">
                  Reported until
                </label>
                <Input
                  id="filter-to"
                  type="date"
                  value={value.to}
                  onChange={(event) => update({ to: event.target.value })}
                />
              </div>
            </>
          )}

          {showMineToggle && (
            <label className="flex items-center gap-2.5 self-end rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={value.mine}
                onChange={(event) => update({ mine: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500/40"
              />
              Only my reports
            </label>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          {typeof total === 'number' ? (
            <>
              <span className="font-bold text-navy-800">{total}</span> complaint
              {total === 1 ? '' : 's'} found
            </>
          ) : (
            'Loading results…'
          )}
        </p>

        <div className="flex items-center gap-2">
          {children}
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={reset}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueFilters;
