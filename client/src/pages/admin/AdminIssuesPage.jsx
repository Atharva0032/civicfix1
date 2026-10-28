import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowBigUp,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  ExternalLink,
  FileX2,
  MapPin,
  UserCog,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CategoryBadge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Pagination,
  PriorityBadge,
  Select,
  StatusBadge,
  TableSkeleton,
  Textarea,
} from '../../components/ui';
import { IssueFilters, EMPTY_FILTERS } from '../../components/issues/IssueFilters';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMeta } from '../../context/MetaContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { cn } from '../../lib/cn';
import { formatDate, truncate } from '../../lib/format';

const COLUMNS = [
  { key: 'complaint', label: 'Complaint', sortKey: null },
  { key: 'category', label: 'Category', sortKey: null },
  { key: 'location', label: 'Location', sortKey: null },
  { key: 'reporter', label: 'Reporter', sortKey: null },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'priority', label: 'Priority', sortKey: 'priority' },
  { key: 'department', label: 'Department', sortKey: null },
  { key: 'supporters', label: 'Supporters', sortKey: 'supporters' },
  { key: 'reported', label: 'Reported', sortKey: 'createdAt' },
  { key: 'actions', label: 'Actions', sortKey: null },
];

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** Modal that bundles status updates, assignment and deletion for one complaint. */
function ManageIssueModal({ issue, administrators, departments, onClose, onUpdated }) {
  const toast = useToast();
  const { statuses } = useMeta();

  const [statusForm, setStatusForm] = useState({
    status: issue.status,
    note: '',
    resolutionNote: '',
    rejectionReason: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [assignForm, setAssignForm] = useState({
    department: issue.assignedDepartment || '',
    assignedTo: issue.assignedTo?._id || '',
    note: '',
  });
  const [assignError, setAssignError] = useState(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isResolvedStatus = statusForm.status === 'resolved';
  const isRejectedStatus = statusForm.status === 'rejected';

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    if (isResolvedStatus && !statusForm.resolutionNote.trim()) {
      setStatusError('Add a resolution note describing the fix before resolving.');
      return;
    }
    if (isRejectedStatus && !statusForm.rejectionReason.trim()) {
      setStatusError('Add a reason explaining why this complaint is rejected.');
      return;
    }

    setStatusSubmitting(true);
    setStatusError(null);
    try {
      let payload;
      if (isResolvedStatus && proofFile) {
        payload = new FormData();
        payload.append('status', statusForm.status);
        payload.append('note', statusForm.note);
        payload.append('resolutionNote', statusForm.resolutionNote);
        payload.append('proof', proofFile);
      } else {
        payload = {
          status: statusForm.status,
          note: statusForm.note,
          resolutionNote: statusForm.resolutionNote,
          rejectionReason: statusForm.rejectionReason,
        };
      }

      const { data } = await api.patch(`/admin/issues/${issue.id}/status`, payload);
      toast.success(data.message || 'Complaint status updated.');
      onUpdated();
    } catch (error) {
      setStatusError(error.message || 'The status could not be updated.');
      toast.error(error.message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAssignSubmit = async (event) => {
    event.preventDefault();
    if (!assignForm.department && !assignForm.assignedTo) {
      setAssignError('Choose a department or an officer to assign this complaint to.');
      return;
    }

    setAssignSubmitting(true);
    setAssignError(null);
    try {
      const payload = {
        ...(assignForm.department ? { department: assignForm.department } : {}),
        assignedTo: assignForm.assignedTo || null,
        note: assignForm.note,
      };
      const { data } = await api.patch(`/admin/issues/${issue.id}/assign`, payload);
      toast.success(data.message || 'Assignment updated.');
      onUpdated();
    } catch (error) {
      setAssignError(error.message || 'The assignment could not be updated.');
      toast.error(error.message);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/issues/${issue.id}`);
      toast.success(data.message || 'Complaint deleted.');
      setDeleteOpen(false);
      onUpdated();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen
        onClose={() => (deleteOpen ? setDeleteOpen(false) : onClose())}
        title="Manage complaint"
        description={issue.complaintId}
        size="lg"
        footer={
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <CategoryBadge category={issue.category} />
            </div>
            <h3 className="mt-3 text-base font-bold leading-snug text-navy-900">
              {issue.title}
            </h3>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reporter
                </dt>
                <dd className="text-slate-600">{issue.reportedBy?.name || 'Citizen'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reported
                </dt>
                <dd className="text-slate-600">{formatDate(issue.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Department
                </dt>
                <dd className="text-slate-600">{issue.assignedDepartment || 'Not routed'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Officer
                </dt>
                <dd className="text-slate-600">{issue.assignedTo?.name || 'Unassigned'}</dd>
              </div>
            </dl>
            <Link
              to={`/issues/${issue.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition hover:text-primary-800"
            >
              Open full complaint page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Panel 1 — status */}
          <form
            onSubmit={handleStatusSubmit}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <h4 className="text-sm font-bold text-navy-900">Update status</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Move this complaint along the municipal workflow.
            </p>

            <div className="mt-3 space-y-3">
              <Field label="New status" htmlFor="manage-status" required>
                <Select
                  id="manage-status"
                  value={statusForm.status}
                  onChange={(event) => {
                    setStatusForm((current) => ({ ...current, status: event.target.value }));
                    setStatusError(null);
                  }}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Administrative note" htmlFor="manage-status-note">
                <Textarea
                  id="manage-status-note"
                  rows={2}
                  value={statusForm.note}
                  onChange={(event) =>
                    setStatusForm((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder="Visible to the citizen on the complaint timeline."
                />
              </Field>

              {isResolvedStatus && (
                <>
                  <Field label="Resolution note" htmlFor="manage-resolution-note" required>
                    <Textarea
                      id="manage-resolution-note"
                      rows={3}
                      value={statusForm.resolutionNote}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          resolutionNote: event.target.value,
                        }))
                      }
                      placeholder="Describe the work carried out on site."
                    />
                  </Field>
                  <Field
                    label="Proof photo"
                    htmlFor="manage-proof"
                    hint="Optional. Attach a photo of the completed fix (image files only)."
                  >
                    <input
                      id="manage-proof"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                      className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-l-xl file:border-0 file:bg-slate-100 file:px-3.5 file:py-3 file:text-sm file:font-semibold file:text-navy-800 hover:file:bg-slate-200"
                    />
                  </Field>
                </>
              )}

              {isRejectedStatus && (
                <Field label="Rejection reason" htmlFor="manage-rejection" required>
                  <Textarea
                    id="manage-rejection"
                    rows={3}
                    value={statusForm.rejectionReason}
                    onChange={(event) =>
                      setStatusForm((current) => ({
                        ...current,
                        rejectionReason: event.target.value,
                      }))
                    }
                    placeholder="Explain why this complaint cannot be actioned."
                  />
                </Field>
              )}

              {statusError && (
                <p className="field-error" role="alert">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {statusError}
                </p>
              )}

              <Button type="submit" isLoading={statusSubmitting} loadingText="Updating…">
                Save status
              </Button>
            </div>
          </form>

          {/* Panel 2 — assignment */}
          <form
            onSubmit={handleAssignSubmit}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <h4 className="text-sm font-bold text-navy-900">Assign</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Route the complaint to a department and a responsible officer.
            </p>

            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Department" htmlFor="manage-department">
                  <Select
                    id="manage-department"
                    value={assignForm.department}
                    onChange={(event) =>
                      setAssignForm((current) => ({
                        ...current,
                        department: event.target.value,
                      }))
                    }
                  >
                    <option value="">Keep current department</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Officer" htmlFor="manage-officer">
                  <Select
                    id="manage-officer"
                    value={assignForm.assignedTo}
                    onChange={(event) =>
                      setAssignForm((current) => ({
                        ...current,
                        assignedTo: event.target.value,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {administrators.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {admin.name} — {admin.email}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Assignment note" htmlFor="manage-assign-note">
                <Textarea
                  id="manage-assign-note"
                  rows={2}
                  value={assignForm.note}
                  onChange={(event) =>
                    setAssignForm((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder="Optional context for the assigned team."
                />
              </Field>

              {assignError && (
                <p className="field-error" role="alert">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {assignError}
                </p>
              )}

              <Button
                type="submit"
                variant="accent"
                leftIcon={UserCog}
                isLoading={assignSubmitting}
                loadingText="Assigning…"
              >
                Save assignment
              </Button>
            </div>
          </form>

          {/* Panel 3 — danger zone */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
            <h4 className="text-sm font-bold text-rose-900">Danger zone</h4>
            <p className="mt-0.5 text-xs text-rose-700">
              Deleting a complaint permanently removes it and all attached photos.
            </p>
            <Button
              variant="dangerOutline"
              className="mt-3"
              onClick={() => setDeleteOpen(true)}
            >
              Delete this complaint
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this complaint?"
        message={`${issue.complaintId} — "${truncate(
          issue.title,
          80,
        )}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete complaint"
        isLoading={deleting}
        tone="danger"
      />
    </>
  );
}

export default function AdminIssuesPage() {
  useDocumentTitle('Complaint Management');

  const [searchParams] = useSearchParams();
  const { categoryLabel, statusLabel, priorityLabel, departments: metaDepartments } = useMeta();
  const toast = useToast();

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    department: searchParams.get('department') ?? '',
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const [sortBy, order] = filters.sort.split(':');

  const params = {
    page,
    limit: 10,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    sortBy,
    order,
  };

  const issues = useApi('/admin/issues', { params });
  const administrators = useApi('/admin/administrators');
  const departmentsRequest = useApi('/admin/departments');

  const departments =
    metaDepartments?.length > 0 ? metaDepartments : departmentsRequest.data || [];

  const rows = issues.data ?? [];

  const handleFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const toggleSort = (column) => {
    setFilters((current) => {
      const [currentBy, currentOrder] = current.sort.split(':');
      const nextOrder =
        currentBy === column && currentOrder === 'desc' ? 'asc' : 'desc';
      return { ...current, sort: `${column}:${nextOrder}` };
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
  };

  const handleExport = () => {
    if (!rows.length) {
      toast.info('There is nothing to export for the current filters.');
      return;
    }
    const header = [
      'Complaint ID',
      'Title',
      'Category',
      'Status',
      'Priority',
      'Department',
      'Reporter',
      'Reported',
    ];
    const lines = rows.map((issue) =>
      [
        issue.complaintId,
        issue.title,
        categoryLabel(issue.category),
        statusLabel(issue.status),
        priorityLabel(issue.priority),
        issue.assignedDepartment || '',
        issue.reportedBy?.name || 'Citizen',
        formatDate(issue.createdAt),
      ]
        .map(csvCell)
        .join(','),
    );
    const csv = `\uFEFF${[header.map(csvCell).join(','), ...lines].join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civicfix-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} complaint${rows.length === 1 ? '' : 's'}.`);
  };

  const handleUpdated = () => {
    setSelected(null);
    issues.refetch();
  };

  const renderSortIndicator = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />;
    }
    return order === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Complaint Management
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Search, triage, assign and resolve every complaint filed with the city.
        </p>
      </div>

      <IssueFilters
        value={filters}
        onChange={handleFiltersChange}
        total={issues.meta?.total}
        showDateRange
        showSort
      >
        <div className="min-w-44">
          <label htmlFor="filter-department" className="sr-only">
            Filter by department
          </label>
          <Select
            id="filter-department"
            value={filters.department}
            onChange={(event) =>
              handleFiltersChange({ ...filters, department: event.target.value })
            }
            aria-label="Filter by department"
            className="h-9 w-auto min-w-44 text-sm"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={Download}
          onClick={handleExport}
          disabled={issues.isLoading || !rows.length}
        >
          Export CSV
        </Button>
      </IssueFilters>

      <Card>
        <CardBody className="p-0">
          {issues.isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={8} columns={6} />
            </div>
          ) : issues.error ? (
            <div className="p-5">
              <ErrorState
                title="Complaints could not be loaded"
                message={issues.error.message}
                onRetry={issues.refetch}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FileX2}
                title="No complaints match these filters"
                description="Try widening the date range or clearing the filters to see more results."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {COLUMNS.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className={cn(
                            'px-4 py-3',
                            column.key === 'supporters' && 'text-right',
                            column.key === 'actions' && 'text-right',
                          )}
                        >
                          {column.sortKey ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(column.sortKey)}
                              aria-label={`Sort by ${column.label}`}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wide transition hover:text-navy-900',
                                sortBy === column.sortKey ? 'text-primary-700' : 'text-slate-500',
                                column.key === 'supporters' && 'ml-auto',
                              )}
                            >
                              {column.label}
                              {renderSortIndicator(column.sortKey)}
                            </button>
                          ) : (
                            column.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="max-w-[260px] px-4 py-3.5">
                          <span className="block font-mono text-[11px] font-semibold text-slate-400">
                            {issue.complaintId}
                          </span>
                          <Link
                            to={`/issues/${issue.id}`}
                            className="font-semibold text-navy-900 transition hover:text-primary-700"
                          >
                            {truncate(issue.title, 48)}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <CategoryBadge category={issue.category} />
                        </td>
                        <td className="max-w-[180px] px-4 py-3.5 text-slate-500">
                          {truncate(issue.location?.area || issue.location?.address || '—', 32)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {issue.reportedBy?.name || 'Citizen'}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityBadge priority={issue.priority} />
                        </td>
                        <td className="max-w-[160px] px-4 py-3.5 text-slate-500">
                          {truncate(issue.assignedDepartment || 'Unassigned', 26)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-600">
                          {issue.upvoteCount ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                          {formatDate(issue.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setSelected(issue)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <ul className="divide-y divide-slate-100 lg:hidden">
                {rows.map((issue) => (
                  <li key={issue.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <CategoryBadge category={issue.category} />
                    </div>
                    <span className="mt-2 block font-mono text-[11px] font-semibold text-slate-400">
                      {issue.complaintId}
                    </span>
                    <Link
                      to={`/issues/${issue.id}`}
                      className="mt-0.5 block font-semibold text-navy-900 transition hover:text-primary-700"
                    >
                      {issue.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {truncate(issue.location?.area || issue.location?.address || '—', 40)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowBigUp className="h-3.5 w-3.5 text-slate-400" />
                        {issue.upvoteCount ?? 0} supporters
                      </span>
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="truncate text-xs text-slate-500">
                        {issue.assignedDepartment || 'Unassigned'}
                      </span>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelected(issue)}
                      >
                        Manage
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardBody>
      </Card>

      {!issues.isLoading && !issues.error && rows.length > 0 && (
        <Pagination meta={issues.meta} onPageChange={setPage} />
      )}

      {selected && (
        <ManageIssueModal
          issue={selected}
          administrators={administrators.data ?? []}
          departments={departments}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
