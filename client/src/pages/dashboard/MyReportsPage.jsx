import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IssueCardSkeleton,
  Pagination,
} from '../../components/ui';
import { IssueCard } from '../../components/issues/IssueCard';
import { EMPTY_FILTERS, IssueFilters } from '../../components/issues/IssueFilters';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

const PAGE_SIZE = 9;

export default function MyReportsPage() {
  useDocumentTitle('My Reports');

  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const params = useMemo(() => {
    const [sortBy, order] = (filters.sort || 'createdAt:desc').split(':');
    const next = {
      mine: 'true',
      page,
      limit: PAGE_SIZE,
      sortBy: sortBy || 'createdAt',
      order: order || 'desc',
    };
    if (filters.search) next.search = filters.search;
    if (filters.category) next.category = filters.category;
    if (filters.status) next.status = filters.status;
    if (filters.priority) next.priority = filters.priority;
    if (filters.from) next.from = filters.from;
    if (filters.to) next.to = filters.to;
    return next;
  }, [filters, page]);

  const { data, meta, isLoading, error, refetch, setData } = useApi('/issues', { params });

  const issues = Array.isArray(data) ? data : [];
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.status ||
      filters.priority ||
      filters.from ||
      filters.to,
  );

  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const handleUpvoted = (id, payload) => {
    setData((current) =>
      Array.isArray(current)
        ? current.map((issue) =>
            issue.id === id
              ? {
                  ...issue,
                  upvoteCount: payload.upvoteCount,
                  hasUpvoted: payload.hasUpvoted,
                }
              : issue,
          )
        : current,
    );
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/issues/${pendingDelete.id}`);
      toast.success(`Complaint ${pendingDelete.complaintId} was withdrawn.`, {
        title: 'Withdrawn',
      });
      setPendingDelete(null);
      refetch();
    } catch (caught) {
      toast.error(
        caught?.message ||
          'We could not withdraw this complaint. A complaint can only be withdrawn while it is still submitted.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">My reports</h1>
        <p className="text-sm text-slate-500">
          Every complaint you have filed with the city, in one place.
        </p>
      </header>

      <IssueFilters
        value={filters}
        onChange={handleFilterChange}
        total={meta?.total}
        showDateRange
        showSort
      >
        <Button as={Link} to="/report" size="sm" leftIcon={PlusCircle}>
          Report an Issue
        </Button>
      </IssueFilters>

      {error ? (
        <ErrorState
          title="We could not load your reports"
          message={error.message}
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <IssueCardSkeleton key={index} />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasActiveFilters ? 'No reports match your filters' : "You haven't reported anything yet"}
          description={
            hasActiveFilters
              ? 'Try widening your search — clear a filter or change the date range to see more of your complaints.'
              : 'Spotted a pothole, a broken streetlight or an overflowing bin? Report it and we will route it to the right department.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={() => handleFilterChange(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            ) : (
              <Button as={Link} to="/report" leftIcon={PlusCircle}>
                Report your first issue
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              showActions
              onUpvoted={handleUpvoted}
              onDeleted={setPendingDelete}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && meta && meta.total > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Withdraw complaint"
        confirmLabel="Withdraw complaint"
        isLoading={isDeleting}
        tone="danger"
        message={
          pendingDelete
            ? `Complaint ${pendingDelete.complaintId} — “${pendingDelete.title}” — will be withdrawn. This can only be done while the complaint is still submitted, and it cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
