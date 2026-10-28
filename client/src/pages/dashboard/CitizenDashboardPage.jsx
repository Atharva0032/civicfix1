import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  Compass,
  FileText,
  Hammer,
  Inbox,
  MapPinned,
  PlusCircle,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CategoryBadge,
  EmptyState,
  ErrorState,
  PriorityBadge,
  StatCard,
  StatusBadge,
  TableSkeleton,
} from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatNumber, percent } from '../../lib/format';

const QUICK_ACTIONS = [
  {
    to: '/report',
    label: 'Report an Issue',
    description: 'File a new complaint with photos and an exact pin.',
    icon: PlusCircle,
    accent: true,
  },
  {
    to: '/explore',
    label: 'Explore Issues',
    description: 'See what other citizens are reporting nearby.',
    icon: Compass,
  },
  {
    to: '/map',
    label: 'Issue Map',
    description: 'Browse every complaint on the city map.',
    icon: MapPinned,
  },
  {
    to: '/dashboard/notifications',
    label: 'Notifications',
    description: 'Live status updates on your complaints.',
    icon: Bell,
    badgeKey: 'unread',
  },
  {
    to: '/dashboard/reports',
    label: 'All my reports',
    description: 'Search and filter everything you have filed.',
    icon: FileText,
  },
];

export default function CitizenDashboardPage() {
  useDocumentTitle('Overview');

  const { user } = useAuth();
  const { unread } = useNotifications();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApi('/issues/stats/me');

  const {
    data: recent,
    isLoading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useApi('/issues', {
    params: { mine: 'true', limit: 5, sortBy: 'createdAt', order: 'desc' },
  });

  const firstName = user?.name?.split(' ')[0] || 'there';
  const resolutionRate = Number(stats?.resolutionRate) || 0;
  const clampedRate = Math.max(0, Math.min(100, resolutionRate));
  const recentIssues = Array.isArray(recent) ? recent : [];
  const hasNoReports = !statsLoading && stats ? stats.total === 0 : false;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-extrabold text-navy-900">
            Good to see you, {firstName}
          </h1>
          <p className="text-sm text-slate-500">
            Here is a snapshot of everything you have reported to the city.
          </p>
        </div>
        <Button as={Link} to="/report" leftIcon={PlusCircle} className="w-full sm:w-auto">
          Report an Issue
        </Button>
      </header>

      {statsError ? (
        <ErrorState
          title="We could not load your statistics"
          message={statsError.message}
          onRetry={refetchStats}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total reports"
              value={formatNumber(stats?.total)}
              hint="Complaints you have filed"
              icon={FileText}
              tone="primary"
              isLoading={statsLoading}
            />
            <StatCard
              label="Open complaints"
              value={formatNumber(stats?.open)}
              hint="Still being worked on"
              icon={Inbox}
              tone="amber"
              isLoading={statsLoading}
            />
            <StatCard
              label="In progress"
              value={formatNumber(stats?.inProgress)}
              hint="A field team is on it"
              icon={Hammer}
              tone="accent"
              isLoading={statsLoading}
            />
            <StatCard
              label="Resolved"
              value={formatNumber(stats?.resolved)}
              hint="Fixed and verified"
              icon={BadgeCheck}
              tone="emerald"
              isLoading={statsLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Rejected"
              value={formatNumber(stats?.rejected)}
              hint="Could not be actioned"
              icon={XCircle}
              tone="rose"
              isLoading={statsLoading}
            />
            <StatCard
              label="Supporters received"
              value={formatNumber(stats?.supportersReceived)}
              hint="Neighbours backing your reports"
              icon={ThumbsUp}
              tone="accent"
              isLoading={statsLoading}
            />
            <StatCard
              label="Unread notifications"
              value={formatNumber(unread)}
              hint="Updates waiting for you"
              icon={Bell}
              tone="primary"
              isLoading={false}
            />

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resolution rate
                  </p>
                  {statsLoading ? (
                    <div className="skeleton mt-2 h-8 w-24" />
                  ) : (
                    <p className="mt-1.5 font-display text-3xl font-extrabold leading-none text-navy-900">
                      {percent(resolutionRate)}
                    </p>
                  )}
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>

              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Resolution rate"
                aria-valuenow={Math.round(clampedRate)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-500"
                  style={{ width: `${statsLoading ? 0 : clampedRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {statsLoading
                  ? 'Loading…'
                  : `${formatNumber(stats?.resolved)} of ${formatNumber(stats?.total)} resolved`}
              </p>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader
          title="Recent reports"
          description="Your five most recent complaints"
          action={
            <Button
              as={Link}
              to="/dashboard/reports"
              variant="ghost"
              size="sm"
              rightIcon={ArrowRight}
            >
              View all
            </Button>
          }
        />
        <CardBody className="p-0">
          {recentError ? (
            <div className="p-5">
              <ErrorState
                title="We could not load your reports"
                message={recentError.message}
                onRetry={refetchRecent}
              />
            </div>
          ) : recentLoading ? (
            <div className="p-5">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : recentIssues.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FileText}
                title={hasNoReports ? 'You have not reported anything yet' : 'No recent reports'}
                description="Spotted a pothole, a broken streetlight or an overflowing bin? Report it and we will route it to the right department."
                action={
                  <Button as={Link} to="/report" leftIcon={PlusCircle}>
                    Report your first issue
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Complaint ID</th>
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Reported</th>
                      <th className="px-5 py-3 text-right">Supporters</th>
                      <th className="px-5 py-3" aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentIssues.map((issue) => (
                      <tr key={issue.id} className="transition hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-slate-500">
                          {issue.complaintId}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="font-semibold text-navy-900 transition hover:text-primary-700"
                          >
                            {issue.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <CategoryBadge category={issue.category} />
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="px-5 py-3">
                          <PriorityBadge priority={issue.priority} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                          {formatDate(issue.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-700">
                          {formatNumber(issue.upvoteCount)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-slate-300" aria-hidden="true" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 md:hidden">
                {recentIssues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      to={`/issues/${issue.id}`}
                      className="block px-5 py-4 transition hover:bg-slate-50/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          {issue.complaintId}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(issue.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-semibold text-navy-900">{issue.title}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                        <CategoryBadge category={issue.category} />
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatNumber(issue.upvoteCount)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardBody>
      </Card>

      <section aria-labelledby="quick-actions-heading" className="space-y-4">
        <h2
          id="quick-actions-heading"
          className="font-display text-lg font-bold text-navy-900"
        >
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const showBadge = action.badgeKey === 'unread' && unread > 0;
            return (
              <Card
                as={Link}
                to={action.to}
                key={action.to}
                className="group flex items-start gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span
                  className={
                    action.accent
                      ? 'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-600 text-white shadow-sm'
                      : 'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700'
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900 transition group-hover:text-primary-700">
                      {action.label}
                    </span>
                    {showBadge && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                    {action.description}
                  </span>
                </span>
                <ChevronRight
                  className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600"
                  aria-hidden="true"
                />
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
