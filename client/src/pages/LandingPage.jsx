import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  ClipboardList,
  Compass,
  Hammer,
  MapPinned,
  PlusCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IssueCardSkeleton,
  Skeleton,
  StatCard,
} from '../components/ui';
import { IssueCard } from '../components/issues/IssueCard';
import { CategoryIcon } from '../components/issues/CategoryIcon';
import { IssueMap } from '../components/map/IssueMap';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMeta } from '../context/MetaContext';
import { formatNumber, percent } from '../lib/format';

const FEATURES = [
  {
    icon: Camera,
    title: 'Report an issue',
    description:
      'Attach a photo, drop a precise map pin and describe the problem. You get a unique complaint ID the moment you submit.',
  },
  {
    icon: ClipboardList,
    title: 'Track it publicly',
    description:
      'Every complaint has a public timeline. Watch it move from submitted to acknowledged, in progress and resolved.',
  },
  {
    icon: Hammer,
    title: 'Authorities fix it',
    description:
      'Complaints are routed to the right municipal department and assigned to an officer who owns the fix.',
  },
  {
    icon: Users,
    title: 'Community support',
    description:
      'Neighbours upvote the issues that matter most, helping the city prioritise the work that affects the most people.',
  },
];

export default function LandingPage() {
  useDocumentTitle('Make Your City Better');

  const { categories } = useMeta();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApi('/stats');

  const {
    data: recentIssues,
    isLoading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useApi('/issues', { params: { limit: 6, sortBy: 'createdAt', order: 'desc' } });

  const {
    data: mapIssues,
    isLoading: mapLoading,
    error: mapError,
    refetch: refetchMap,
  } = useApi('/issues/map', { params: { limit: 40 } });

  const rate = Number(stats?.resolutionRate) || 0;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <Badge className="border border-primary-200 bg-primary-50 text-primary-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Smart City Issue Reporter
            </Badge>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
              Make Your City Better, One Report at a Time.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              CivicFix connects citizens directly with the municipal corporation. Spot a
              pothole, a broken streetlight or an overflowing bin? Report it in seconds, follow
              it through a transparent timeline, and watch your city fix it.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button as={Link} to="/report" size="lg" leftIcon={PlusCircle}>
                Report an Issue
              </Button>
              <Button
                as={Link}
                to="/explore"
                size="lg"
                variant="outline"
                leftIcon={Compass}
                rightIcon={ArrowRight}
              >
                Explore Issues
              </Button>
            </div>

            <Link
              to="/map"
              className="link mt-6 inline-flex items-center gap-2 text-sm"
            >
              <MapPinned className="h-4 w-4" aria-hidden="true" />
              Or see every complaint on the live city map
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Live statistics                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-slate-50 py-14 sm:py-16" aria-labelledby="stats-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="stats-heading" className="font-display text-2xl font-extrabold text-navy-900">
                Live civic impact
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Real numbers, pulled straight from the complaint register.
              </p>
            </div>
          </div>

          {statsError ? (
            <ErrorState
              className="mt-6"
              title="Statistics are unavailable right now"
              message={statsError.message}
              onRetry={refetchStats}
            />
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-stretch">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total complaints"
                  value={formatNumber(stats?.totalIssues ?? 0)}
                  hint="Reported by citizens"
                  icon={ClipboardList}
                  tone="primary"
                  isLoading={statsLoading}
                />
                <StatCard
                  label="Resolved"
                  value={formatNumber(stats?.resolvedIssues ?? 0)}
                  hint="Fixed and verified"
                  icon={BadgeCheck}
                  tone="emerald"
                  isLoading={statsLoading}
                />
                <StatCard
                  label="In progress"
                  value={formatNumber(stats?.inProgressIssues ?? 0)}
                  hint="Work underway"
                  icon={Activity}
                  tone="amber"
                  isLoading={statsLoading}
                />
                <StatCard
                  label="Active citizens"
                  value={formatNumber(stats?.activeCitizens ?? 0)}
                  hint="People reporting"
                  icon={Users}
                  tone="accent"
                  isLoading={statsLoading}
                />
              </div>

              <Card className="flex items-center gap-5 p-5 lg:w-72">
                {statsLoading ? (
                  <Skeleton className="h-24 w-24 rounded-full" />
                ) : (
                  <div
                    className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#0d9488 ${rate * 3.6}deg, #e2e8f0 0deg)`,
                    }}
                    role="img"
                    aria-label={`Resolution rate ${percent(rate)}`}
                  >
                    <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-white">
                      <span className="font-display text-lg font-extrabold text-navy-900">
                        {percent(rate)}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resolution rate
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Share of all complaints successfully resolved on the ground.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How CivicFix works                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-14 sm:py-20" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 id="how-heading" className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">
              How CivicFix works
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-500">
              A simple loop that turns a citizen&rsquo;s observation into a completed job for the
              city &mdash; with full visibility at every step.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="p-6 transition hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Category showcase                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-slate-50 py-14 sm:py-20" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2
              id="categories-heading"
              className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
            >
              Report almost anything
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-500">
              Each category is routed to the municipal department responsible for fixing it.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Card
                key={category.value}
                className="p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-700">
                  <CategoryIcon category={category.value} className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 text-base font-bold text-navy-900">{category.label}</h3>
                <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  {category.department || 'General Administration'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Recent complaints                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-14 sm:py-20" aria-labelledby="recent-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2
                id="recent-heading"
                className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
              >
                Recent civic issue reports
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-500">
                The latest complaints filed by citizens across the city.
              </p>
            </div>
            <Button as={Link} to="/explore" variant="outline" rightIcon={ArrowRight}>
              View all complaints
            </Button>
          </div>

          <div className="mt-8">
            {recentError ? (
              <ErrorState
                title="We couldn't load recent complaints"
                message={recentError.message}
                onRetry={refetchRecent}
              />
            ) : recentLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <IssueCardSkeleton key={index} />
                ))}
              </div>
            ) : recentIssues && recentIssues.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {recentIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No complaints yet"
                description="Be the first to report an issue in your neighbourhood and start improving your city."
                action={
                  <Button as={Link} to="/report" leftIcon={PlusCircle}>
                    Report an Issue
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Map preview                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-slate-50 py-14 sm:py-20" aria-labelledby="map-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2
                id="map-heading"
                className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl"
              >
                Every report, on one map
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-500">
                Markers are colour-coded by status so you can see what is open and what has been
                fixed near you.
              </p>
            </div>
            <Button as={Link} to="/map" variant="outline" rightIcon={ArrowRight}>
              Open the full map
            </Button>
          </div>

          <div className="mt-8">
            {mapError ? (
              <ErrorState
                title="The map preview is unavailable"
                message={mapError.message}
                onRetry={refetchMap}
              />
            ) : mapLoading ? (
              <Skeleton className="h-[380px] rounded-2xl" />
            ) : (
              <IssueMap
                issues={mapIssues || []}
                height={380}
                fitOnLoad
                showLegend={false}
              />
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Closing CTA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-slate-50 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-primary-800 via-primary-700 to-accent-700 px-6 py-14 text-center sm:px-12 sm:py-16">
            <div
              className="grid-pattern pointer-events-none absolute inset-0 opacity-20"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                Spotted something that needs fixing?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-50">
                It takes less than a minute to report an issue &mdash; and every report helps the
                municipal corporation make the city a little better.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button as={Link} to="/report" size="lg" variant="inverse" leftIcon={PlusCircle}>
                  Report an Issue
                </Button>
                <Button
                  as={Link}
                  to="/explore"
                  size="lg"
                  variant="inverse"
                  leftIcon={Compass}
                >
                  Explore Issues
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
