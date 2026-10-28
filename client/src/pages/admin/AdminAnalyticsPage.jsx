import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Gauge,
  Inbox,
  Lightbulb,
  Printer,
  Timer,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CategoryBadge,
  ErrorState,
  Select,
  Skeleton,
  StatCard,
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
import { useMeta } from '../../context/MetaContext';
import api from '../../lib/api';
import { formatDate, formatDuration, formatNumber, percent } from '../../lib/format';

const PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 180 days' },
];

export default function AdminAnalyticsPage() {
  useDocumentTitle('Analytics');

  const { categoryLabel, categories } = useMeta();
  const [days, setDays] = useState(30);

  const statsRequest = useApi('/admin/stats', { params: { days } });

  const stats = statsRequest.data;
  const totals = stats?.totals;
  const isLoading = statsRequest.isLoading;
  const byCategory = stats?.byCategory ?? [];

  const [categoryRows, setCategoryRows] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  const categoryKey = byCategory.map((entry) => entry.category).join('|');

  useEffect(() => {
    const list = byCategory;
    if (!list.length) {
      setCategoryRows([]);
      return undefined;
    }

    let cancelled = false;
    setIsResolving(true);
    setCategoryError(null);

    Promise.all(
      list.map(async (entry) => {
        try {
          const { data } = await api.get('/admin/issues', {
            params: { category: entry.category, status: 'resolved', limit: 1 },
          });
          return {
            category: entry.category,
            total: entry.count,
            resolved: data.meta?.total ?? 0,
          };
        } catch {
          return { category: entry.category, total: entry.count, resolved: null };
        }
      }),
    )
      .then((rows) => {
        if (cancelled) return;
        setCategoryRows(rows);
        setIsResolving(false);
      })
      .catch((caught) => {
        if (cancelled) return;
        setCategoryError(caught);
        setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey]);

  const resolvedByCategory = useMemo(() => {
    const map = new Map();
    categoryRows.forEach((row) => map.set(row.category, row.resolved));
    return map;
  }, [categoryRows]);

  const insights = useMemo(() => {
    if (!stats) return [];
    const lines = [];

    const topCategory = stats.byCategory?.[0];
    if (topCategory) {
      lines.push(
        `${categoryLabel(topCategory.category)} is the busiest category, with ${formatNumber(
          topCategory.count,
        )} complaints filed.`,
      );
    }

    const busiestDepartment = stats.byDepartment?.[0];
    if (busiestDepartment) {
      lines.push(
        `${busiestDepartment.department} carries the heaviest workload, handling ${formatNumber(
          busiestDepartment.count,
        )} complaints.`,
      );
    }

    const timeline = stats.timeline ?? [];
    if (timeline.length) {
      const busiestDay = timeline.reduce(
        (max, entry) => (entry.created > (max?.created ?? -1) ? entry : max),
        null,
      );
      if (busiestDay && busiestDay.created > 0) {
        lines.push(
          `Filing peaked on ${formatDate(busiestDay.date)} with ${formatNumber(
            busiestDay.created,
          )} new complaints.`,
        );
      }
    }

    const recentWeek = timeline.slice(-7);
    const created = recentWeek.reduce((sum, entry) => sum + entry.created, 0);
    const resolved = recentWeek.reduce((sum, entry) => sum + entry.resolved, 0);
    if (created || resolved) {
      lines.push(
        resolved >= created
          ? `Over the last 7 days the team resolved ${formatNumber(
              resolved,
            )} complaints against ${formatNumber(
              created,
            )} filed — the backlog is shrinking.`
          : `Over the last 7 days ${formatNumber(created)} complaints were filed but only ${formatNumber(
              resolved,
            )} resolved — the backlog is growing.`,
      );
    }

    return lines;
  }, [stats, categoryLabel]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Trends, distribution and departmental performance across the city.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-48">
            <label htmlFor="analytics-period" className="sr-only">
              Reporting period
            </label>
            <Select
              id="analytics-period"
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
          <Button
            variant="outline"
            leftIcon={Printer}
            onClick={() => window.print()}
            className="print:hidden"
          >
            Print report
          </Button>
        </div>
      </div>

      {statsRequest.error ? (
        <ErrorState
          title="Analytics data is unavailable"
          message={statsRequest.error.message}
          onRetry={statsRequest.refetch}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total complaints"
              value={formatNumber(totals?.total)}
              hint={stats ? `Across the last ${stats.windowDays} days` : undefined}
              icon={FileText}
              tone="primary"
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
              label="Rejection rate"
              value={stats ? percent(stats.rejectionRate) : '—'}
              hint="Share of complaints rejected"
              icon={XCircle}
              tone="rose"
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
            <StatCard
              label="Open backlog"
              value={formatNumber(totals?.open)}
              hint="Submitted, acknowledged or in progress"
              icon={Inbox}
              tone="amber"
              isLoading={isLoading}
            />
            <StatCard
              label="Resolved"
              value={formatNumber(totals?.resolved)}
              hint="Verified and closed complaints"
              icon={CheckCircle2}
              tone="emerald"
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Complaints over time"
                description="Daily complaints filed versus resolved"
              />
              <CardBody>
                <ComplaintsOverTimeChart
                  data={stats?.timeline ?? []}
                  isLoading={isLoading}
                  height={320}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Status distribution" description="Current pipeline composition" />
              <CardBody>
                <StatusDistributionChart data={stats?.byStatus ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Complaints by category" description="Volume per service" />
              <CardBody>
                <ComplaintsByCategoryChart data={byCategory} isLoading={isLoading} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Priority distribution" description="Urgency of incoming reports" />
              <CardBody>
                <PriorityDistributionChart data={stats?.byPriority ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Department workload" description="Complaints per department" />
              <CardBody>
                <DepartmentWorkloadChart data={stats?.byDepartment ?? []} isLoading={isLoading} />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Category performance"
              description="Volume, resolved count and the department responsible"
              icon={BarChart3}
            />
            <CardBody className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : byCategory.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No complaints have been filed yet.
                </p>
              ) : (
                <>
                  {categoryError && (
                    <p className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs font-medium text-amber-700">
                      Some resolved counts could not be loaded and are shown as “—”.
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th scope="col" className="px-5 py-3">
                            Category
                          </th>
                          <th scope="col" className="px-5 py-3 text-right">
                            Complaints
                          </th>
                          <th scope="col" className="px-5 py-3 text-right">
                            Resolved
                          </th>
                          <th scope="col" className="px-5 py-3">
                            Resolution rate
                          </th>
                          <th scope="col" className="px-5 py-3">
                            Department
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {byCategory.map((entry) => {
                          const resolved = resolvedByCategory.get(entry.category);
                          const hasResolved = typeof resolved === 'number';
                          const rate = hasResolved && entry.count
                            ? (resolved / entry.count) * 100
                            : 0;
                          const department = categories.find(
                            (category) => category.value === entry.category,
                          )?.department;

                          return (
                            <tr
                              key={entry.category}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                            >
                              <td className="px-5 py-3.5">
                                <CategoryBadge category={entry.category} />
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-navy-900">
                                {formatNumber(entry.count)}
                              </td>
                              <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                                {isResolving ? (
                                  <Skeleton className="ml-auto h-4 w-10" />
                                ) : hasResolved ? (
                                  formatNumber(resolved)
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                {isResolving ? (
                                  <Skeleton className="h-2 w-full max-w-[140px]" />
                                ) : hasResolved ? (
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100"
                                      role="progressbar"
                                      aria-label={`Resolution rate for ${categoryLabel(
                                        entry.category,
                                      )}`}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                      aria-valuenow={Math.round(rate)}
                                    >
                                      <div
                                        className="h-full rounded-full bg-accent-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, rate)}%` }}
                                      />
                                    </div>
                                    <span className="w-12 shrink-0 text-xs font-bold text-navy-800">
                                      {percent(rate)}
                                    </span>
                                  </div>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-slate-600">
                                {department || 'Unassigned'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Municipal insights"
              description="Automatically generated from the current period"
              icon={Lightbulb}
            />
            <CardBody>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : insights.length === 0 ? (
                <p className="text-sm text-slate-500">
                  There is not enough activity in this period to surface insights yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {insights.map((insight) => (
                    <li key={insight} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                        <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  Window: {stats?.windowDays ?? days} days
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {formatNumber(stats?.byDepartment?.length ?? 0)} active departments
                </span>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
