import { useMemo, useState } from 'react';
import { FileText, Search, UserCheck, UserX, Users } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  Input,
  Select,
  StatCard,
  TableSkeleton,
} from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatDateTime, formatNumber, initials } from '../../lib/format';
import { cn } from '../../lib/cn';

const avatarTones = [
  'bg-primary-100 text-primary-700',
  'bg-accent-100 text-accent-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
];

export default function AdminCitizensPage() {
  useDocumentTitle('Citizens');

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('reports');

  const citizensRequest = useApi('/admin/citizens', { params: { limit: 100 } });
  const issuesRequest = useApi('/admin/issues', {
    params: { limit: 100, sortBy: 'createdAt', order: 'desc' },
  });

  const citizens = citizensRequest.data ?? [];
  const sampleIssues = issuesRequest.data ?? [];

  const reportCounts = useMemo(() => {
    const map = new Map();
    sampleIssues.forEach((issue) => {
      const id = issue.reportedBy?._id;
      if (!id) return;
      map.set(id, (map.get(id) ?? 0) + 1);
    });
    return map;
  }, [sampleIssues]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const enriched = citizens.map((citizen) => ({
      ...citizen,
      reports: reportCounts.get(citizen._id) ?? 0,
    }));

    const filtered = term
      ? enriched.filter(
          (citizen) =>
            citizen.name?.toLowerCase().includes(term) ||
            citizen.email?.toLowerCase().includes(term),
        )
      : enriched;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
      }
      if (b.reports !== a.reports) return b.reports - a.reports;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [citizens, reportCounts, query, sortBy]);

  const maxReports = Math.max(1, ...rows.map((row) => row.reports));
  const citizensWithReports = citizens.filter(
    (citizen) => (reportCounts.get(citizen._id) ?? 0) > 0,
  ).length;

  const isLoading = citizensRequest.isLoading || issuesRequest.isLoading;

  const handleRetry = () => {
    citizensRequest.refetch();
    issuesRequest.refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Citizens
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          The registered resident directory and their recent reporting activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total citizens"
          value={formatNumber(citizens.length)}
          hint="Registered accounts"
          icon={Users}
          tone="primary"
          isLoading={isLoading}
        />
        <StatCard
          label="Citizens with reports"
          value={formatNumber(citizensWithReports)}
          hint="At least one complaint filed"
          icon={UserCheck}
          tone="accent"
          isLoading={isLoading}
        />
        <StatCard
          label="Reports in sample"
          value={formatNumber(sampleIssues.length)}
          hint="Most recent complaints sampled"
          icon={FileText}
          tone="amber"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader
          title="Citizen directory"
          description="Search by name or email, and sort by reporting activity"
        />
        <CardBody className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search citizens by name or email…"
                aria-label="Search citizens"
                className="pl-10"
              />
            </div>
            <div className="sm:w-52">
              <label htmlFor="citizen-sort" className="sr-only">
                Sort citizens
              </label>
              <Select
                id="citizen-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort citizens"
              >
                <option value="reports">Most reports</option>
                <option value="newest">Newest first</option>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={8} columns={6} />
            </div>
          ) : citizensRequest.error ? (
            <div className="p-5">
              <ErrorState
                title="Citizens could not be loaded"
                message={citizensRequest.error.message}
                onRetry={handleRetry}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={UserX}
                title={query ? 'No citizens match your search' : 'No citizens yet'}
                description={
                  query
                    ? 'Try a different name or clear the search box.'
                    : 'Registered residents will appear here once they sign up.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">
                      Citizen
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Email
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Phone
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Reports (recent sample)
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Joined
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Last sign-in
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((citizen, index) => (
                    <tr
                      key={citizen._id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold',
                              avatarTones[index % avatarTones.length],
                            )}
                            aria-hidden="true"
                          >
                            {initials(citizen.name)}
                          </span>
                          <span className="font-semibold text-navy-900">
                            {citizen.name || 'Unnamed citizen'}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{citizen.email}</td>
                      <td className="px-5 py-3.5 text-slate-600">{citizen.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-navy-900">
                        {formatNumber(citizen.reports)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                        {formatDate(citizen.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                        {citizen.lastLoginAt ? formatDateTime(citizen.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100"
                          role="img"
                          aria-label={`${citizen.reports} recent report${
                            citizen.reports === 1 ? '' : 's'
                          }`}
                        >
                          <div
                            className="h-full rounded-full bg-primary-500 transition-all duration-500"
                            style={{ width: `${(citizen.reports / maxReports) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
