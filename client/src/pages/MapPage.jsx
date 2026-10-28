import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ListFilter, MapPin, RotateCcw } from 'lucide-react';
import {
  Button,
  EmptyState,
  ErrorState,
  Select,
  Skeleton,
  StatusBadge,
} from '../components/ui';
import { IssueMap } from '../components/map/IssueMap';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMeta } from '../context/MetaContext';
import { STATUS_STYLES } from '../lib/constants';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/format';

const EMPTY_MAP_FILTERS = { category: '', status: '', priority: '' };

export default function MapPage() {
  useDocumentTitle('Issue Map');

  const { categories, statuses, priorities } = useMeta();
  const [filters, setFilters] = useState(EMPTY_MAP_FILTERS);
  const [activeId, setActiveId] = useState(null);
  const itemRefs = useRef({});

  const params = useMemo(
    () => ({
      category: filters.category || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      limit: 100,
    }),
    [filters],
  );

  const { data, isLoading, error, refetch } = useApi('/issues/map', { params });
  const issues = data || [];

  const update = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setActiveId(null);
  };

  const reset = () => {
    setFilters(EMPTY_MAP_FILTERS);
    setActiveId(null);
  };

  const hasFilters = Boolean(filters.category || filters.status || filters.priority);

  const selectMarker = (id) => {
    setActiveId(id);
    itemRefs.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          Live city map
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Issue Map
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Every reported issue, plotted on the map. Marker colours represent the complaint status
          &mdash; select a complaint from the list to highlight it.
        </p>
      </header>

      {/* Filter bar */}
      <div className="surface mt-8 flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="map-category">
              Category
            </label>
            <Select
              id="map-category"
              value={filters.category}
              onChange={(event) => update({ category: event.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label" htmlFor="map-status">
              Status
            </label>
            <Select
              id="map-status"
              value={filters.status}
              onChange={(event) => update({ status: event.target.value })}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label" htmlFor="map-priority">
              Priority
            </label>
            <Select
              id="map-priority"
              value={filters.priority}
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
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <ListFilter className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="font-bold text-navy-800">{issues.length}</span> shown
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={reset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
        <span className="font-semibold uppercase tracking-wide text-slate-400">Status</span>
        {Object.entries(STATUS_STYLES).map(([status, style]) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: style.marker }}
              aria-hidden="true"
            />
            {style.label}
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="mt-6">
        {error ? (
          <ErrorState
            title="We couldn't load the map"
            message={error.message}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-[560px] rounded-2xl lg:col-span-2" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : issues.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No complaints on the map"
            description={
              hasFilters
                ? 'No complaints match the selected filters. Try resetting them to see all markers.'
                : 'There are no mapped complaints yet. Reports with a location will appear here.'
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={reset}>
                  Reset filters
                </Button>
              ) : (
                <Button as={Link} to="/explore" variant="outline">
                  Browse complaints
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <IssueMap
                issues={issues}
                activeId={activeId}
                height={560}
                fitOnLoad
                showLegend
                className="h-full"
              />
            </div>

            <div className="lg:col-span-1">
              <div className="surface flex h-full flex-col p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <ListFilter className="h-4 w-4 text-primary-500" aria-hidden="true" />
                  Visible complaints
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Click a complaint to highlight its marker.
                </p>

                <ul className="mt-4 max-h-[560px] space-y-2.5 overflow-y-auto pr-1 scrollbar-thin">
                  {issues.map((issue) => (
                    <li key={issue.id}>
                      <div
                        ref={(element) => {
                          itemRefs.current[issue.id] = element;
                        }}
                        className={cn(
                          'rounded-2xl border bg-white p-3.5 transition',
                          activeId === issue.id
                            ? 'border-primary-400 ring-2 ring-primary-500/40'
                            : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => selectMarker(issue.id)}
                          aria-pressed={activeId === issue.id}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-400">
                              {issue.complaintId}
                            </span>
                            <StatusBadge status={issue.status} />
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-navy-900">
                            {issue.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                              <span className="truncate">
                                {issue.area || issue.address || 'Location pinned'}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                              {timeAgo(issue.createdAt)}
                            </span>
                          </div>
                        </button>

                        <div className="mt-2.5 flex justify-end border-t border-slate-100 pt-2">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="link inline-flex items-center gap-1 text-xs"
                          >
                            View complaint
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
