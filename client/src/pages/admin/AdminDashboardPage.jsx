import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Inbox,
  Timer,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  CategoryBadge,
  ErrorState,
  PriorityBadge,
  Select,
  Skeleton,
  StatCard,
  StatusBadge,
  TableSkeleton,
} from '../../components/ui';
import {
  ComplaintsByCategoryChart,
  ComplaintsOverTimeChart,
  DepartmentWorkloadChart,
  PriorityDistributionChart,
  StatusDistributionChart,
} from '../../components/charts';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  formatDate,
  formatDuration,
  formatNumber,
  percent,
  truncate,
} from '../../lib/format';

const PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

export default function AdminDashboardPage() {
  useDocumentTitle('Municipal Dashboard');

  const [days, setDays] = useState(30);

  const statsRequest = useApi('/admin/stats', { params: { days } });
  const recentRequest = useApi('/admin/issues', {
    params: { limit: 6, sortBy: 'createdAt', order: 'desc' },
  });

  const stats = statsRequest.data;
  const totals = stats?.totals;
  const isLoading = statsRequest.isLoading;

  const resolutionRate = Number(stats?.resolutionRate) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
            Municipal Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            A live operational snapshot of every complaint filed with the city.
          </p>
        </div>

        <div className="w-full sm:w-52">
          <label htmlFor="dashboard-period" className="sr-only">
            Reporting period
          </label>
          <Select
            id="dashboard-period"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            aria-label="Reporting period"
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {statsRequest.error ? (
        <ErrorState
          title="The dashboard metrics are unavailable"
          message={statsRequest.error.message}
          onRetry={statsRequest.refetch}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total complaints"
              value={formatNumber(totals?.total)}
              hint={stats ? `Across the last ${stats.windowDays} days` : undefined}
              icon={FileText}
              tone="primary"
              isLoading={isLoading}
            />
            <StatCard
              label="Pending"
              value={formatNumber(totals?.pending)}
              hint="Awaiting acknowledgement"
              icon={Clock}
              tone="amber"
              isLoading={isLoading}
            />
            <StatCard
              label="In progress"
              value={formatNumber(totals?.inProgress)}
              hint="Field teams on site"
              icon={Activity}
              tone="primary"
              isLoading={isLoading}
            />
            <StatCard
              label="Resolved"
              value={formatNumber(totals?.resolved)}
              hint="Verified and closed"
              icon={CheckCircle2}
              tone="emerald"
              isLoading={isLoading}
            />
            <StatCard
              label="Rejected"
              value={formatNumber(totals?.rejected)}
              hint="Could not be actioned"
              icon={XCircle}
              tone="rose"
              isLoading={isLoading}
            />
            <StatCard
              label="Open backlog"
              value={formatNumber(totals?.open)}
              hint="Submitted, acknowledged or in progress"
              icon={Inbox}
              tone="amber"
              isLoading={isLoading}
            />
            <StatCard
              label="Resolution rate"
              value={stats ? percent(stats.resolutionRate) : '—'}
              hint="Share of complaints resolved"
              icon={Gauge}
              tone="accent"
              isLoading={isLoading}
            />
            <StatCard
              label="Average resolution time"
              value={stats ? formatDuration(stats.averageResolutionHours) : '—'}
              hint="From filing to resolution"
              icon={Timer}
              tone="slate"
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader
              title="Resolution rate"
              description={
                stats
                  ? `${formatNumber(totals?.resolved)} of ${formatNumber(totals?.total)} complaints resolved`
                  : 'Share of complaints resolved'
              }
              icon={Gauge}
            />
            <CardBody>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-4">
                    <p className="font-display text-3xl font-extrabold text-navy-900">
                      {percent(stats?.resolutionRate)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatNumber(totals?.resolved)} resolved ·{' '}
                      {formatNumber(totals?.rejected)} rejected
                    </p>
                  </div>
                  <div
                    className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="Resolution rate"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(resolutionRate)}
                  >
                    <div
                      className="h-full rounded-full bg-accent-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, resolutionRate))}%` }}
                    />
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Complaints over time"
              description="Daily volume of reports filed versus resolved"
            />
            <CardBody>
              <ComplaintsOverTimeChart data={stats?.timeline ?? []} isLoading={isLoading} />
            </CardBody>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Complaints by category" description="Volume per municipal service" />
              <CardBody>
                <ComplaintsByCategoryChart data={stats?.byCategory ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Status distribution" description="Where complaints currently sit" />
              <CardBody>
                <StatusDistributionChart data={stats?.byStatus ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Priority distribution" description="How urgent the incoming volume is" />
              <CardBody>
                <PriorityDistributionChart data={stats?.byPriority ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Department workload" description="Complaints routed to each department" />
              <CardBody>
                <DepartmentWorkloadChart data={stats?.byDepartment ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader
          title="Recent submissions"
          description="The six most recent complaints filed by citizens"
          action={
            <Link
              to="/admin/issues"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition hover:text-primary-800"
            >
              Manage all complaints
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recentRequest.isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={6} columns={7} />
            </div>
          ) : recentRequest.error ? (
            <div className="p-5">
              <ErrorState
                title="Recent complaints could not be loaded"
                message={recentRequest.error.message}
                onRetry={recentRequest.refetch}
              />
            </div>
          ) : (recentRequest.data?.length ?? 0) === 0 ? (
            <div className="p-5">
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
                No complaints have been filed yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">
                      Complaint
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Reporter
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Priority
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Reported
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequest.data.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <span className="block font-mono text-[11px] font-semibold text-slate-400">
                          {issue.complaintId}
                        </span>
                        <Link
                          to={`/issues/${issue.id}`}
                          className="font-semibold text-navy-900 transition hover:text-primary-700"
                        >
                          {truncate(issue.title, 52)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <CategoryBadge category={issue.category} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {issue.reportedBy?.name || 'Citizen'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {formatDate(issue.createdAt)}
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
