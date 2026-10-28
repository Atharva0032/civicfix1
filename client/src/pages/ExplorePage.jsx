import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, PlusCircle, SearchX } from 'lucide-react';
import {
  Button,
  EmptyState,
  ErrorState,
  IssueCardSkeleton,
  Pagination,
} from '../components/ui';
import { IssueCard } from '../components/issues/IssueCard';
import { IssueFilters, EMPTY_FILTERS } from '../components/issues/IssueFilters';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatNumber } from '../lib/format';

const PAGE_SIZE = 9;

export default function ExplorePage() {
  useDocumentTitle('Explore Issues');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  // Bumping this key remounts the filter bar so its internal search box resets too.
  const [filterResetKey, setFilterResetKey] = useState(0);

  const params = useMemo(() => {
    const [sortBy, order] = filters.sort ? filters.sort.split(':') : [];
    return {
      page,
      limit: PAGE_SIZE,
      search: filters.search || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      mine: filters.mine ? 'true' : undefined,
      sortBy: sortBy || undefined,
      order: order || undefined,
    };
  }, [filters, page]);

  const { data, meta, isLoading, error, refetch, setData } = useApi('/issues', { params });

  const issues = data || [];
  const hasFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.status ||
      filters.priority ||
      filters.from ||
      filters.to ||
      filters.mine,
  );

  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const handleClear = () => {
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
    setFilterResetKey((key) => key + 1);
  };

  const handleUpvoted = (id, result) => {
    setData((previous) =>
      Array.isArray(previous)
        ? previous.map((issue) =>
            issue.id === id
              ? { ...issue, upvoteCount: result.upvoteCount, hasUpvoted: result.hasUpvoted }
              : issue,
          )
        : previous,
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          Public complaint feed
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Explore Issues
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Browse every complaint filed by citizens. Search by title, address or complaint ID, and
          filter by category, status, priority or date.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-500">
          <span className="font-bold text-navy-800">
            {formatNumber(meta?.total ?? 0)}
          </span>{' '}
          complaint{meta?.total === 1 ? '' : 's'} in the register
        </p>
      </header>

      <div className="mt-8">
        <IssueFilters
          key={filterResetKey}
          value={filters}
          onChange={handleFilterChange}
          total={meta?.total}
          showDateRange
          showSort
          showMineToggle
        />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState
            title="We couldn't load complaints"
            message={error.message}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <IssueCardSkeleton key={index} />
            ))}
          </div>
        ) : issues.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onUpvoted={handleUpvoted} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No complaints match your filters"
            description={
              hasFilters
                ? 'Try widening your search or clearing the filters to see more complaints.'
                : 'No complaints have been filed yet. Be the first to report an issue.'
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                {hasFilters && (
                  <Button variant="outline" onClick={handleClear}>
                    Clear filters
                  </Button>
                )}
                <Button as={Link} to="/report" leftIcon={PlusCircle}>
                  Report an Issue
                </Button>
              </div>
            }
          />
        )}
      </div>

      {!error && issues.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} className="mt-8" />
      )}
    </div>
  );
}
