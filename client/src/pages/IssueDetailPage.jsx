import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowBigUp,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  Clock,
  Copy,
  FileText,
  Images,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CategoryBadge,
  ConfirmDialog,
  ErrorState,
  Field,
  Input,
  Modal,
  PageLoader,
  PriorityBadge,
  Select,
  StatusBadge,
  Textarea,
} from '../components/ui';
import { PhotoGallery } from '../components/issues/PhotoGallery';
import { StatusTimeline } from '../components/issues/StatusTimeline';
import { IssueMap } from '../components/map/IssueMap';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useMeta } from '../context/MetaContext';
import { formatDateTime, formatNumber, timeAgo } from '../lib/format';
import { cn } from '../lib/cn';
import api from '../lib/api';

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="break-words text-sm font-medium text-navy-900">{value}</p>
      </div>
    </div>
  );
}

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isAdmin } = useAuth();
  const { categories, priorities } = useMeta();

  const { data: issue, isLoading, error, refetch, setData } = useApi(`/issues/${id}`, {
    deps: [id],
  });

  const [copied, setCopied] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');

  useDocumentTitle(issue?.title ? issue.title : 'Complaint');

  if (isLoading) {
    return <PageLoader label="Loading complaint…" />;
  }

  if (error || !issue) {
    const notFound = error?.status === 404;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          title={notFound ? 'Complaint not found' : 'We couldn’t load this complaint'}
          message={
            notFound
              ? 'That complaint does not exist, or the reference is incorrect.'
              : error?.message
          }
          onRetry={refetch}
        />
        <div className="mt-5 flex justify-center">
          <Button as={Link} to="/explore" variant="outline" leftIcon={ArrowLeft}>
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  const lat = Number(issue.location?.lat);
  const lng = Number(issue.location?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const marker = hasCoords
    ? {
        id: issue.id,
        lat,
        lng,
        status: issue.status,
        category: issue.category,
        title: issue.title,
        address: issue.location?.address,
        area: issue.location?.area,
        upvoteCount: issue.upvoteCount ?? 0,
        thumbnail: issue.photos?.[0]?.url,
        createdAt: issue.createdAt,
      }
    : null;

  const locationLabel =
    [issue.location?.area, issue.location?.city].filter(Boolean).join(', ') ||
    issue.location?.address ||
    '—';

  const canManage = issue.canEdit && !isAdmin && issue.status === 'submitted';

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error('Copying is not supported in this browser. Please copy it manually.');
      return;
    }
    try {
      await navigator.clipboard.writeText(issue.complaintId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the complaint ID. Please copy it manually.');
    }
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast.info('Sign in to support this complaint.');
      return;
    }

    const nextVoted = !issue.hasUpvoted;
    const previousCount = issue.upvoteCount ?? 0;

    setData((current) => ({
      ...current,
      hasUpvoted: nextVoted,
      upvoteCount: Math.max(0, previousCount + (nextVoted ? 1 : -1)),
    }));
    setIsVoting(true);

    try {
      const { data } = nextVoted
        ? await api.post(`/issues/${id}/upvote`)
        : await api.delete(`/issues/${id}/upvote`);
      setData((current) => ({
        ...current,
        upvoteCount: data.data.upvoteCount,
        hasUpvoted: data.data.hasUpvoted,
      }));
    } catch (caught) {
      setData((current) => ({
        ...current,
        hasUpvoted: !nextVoted,
        upvoteCount: previousCount,
      }));
      toast.error(caught.message);
    } finally {
      setIsVoting(false);
    }
  };

  const openEdit = () => {
    setForm({
      title: issue.title || '',
      description: issue.description || '',
      category: issue.category || '',
      priority: issue.priority || '',
      address: issue.location?.address || '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');
    try {
      const { data } = await api.patch(`/issues/${id}`, form);
      setData(data.data);
      setIsEditOpen(false);
      toast.success('Complaint updated.');
    } catch (caught) {
      const detailMessage = Array.isArray(caught.details)
        ? caught.details.map((detail) => detail.message).join(' ')
        : '';
      setFormError(detailMessage || caught.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await api.delete(`/issues/${id}`);
      toast.success('Your complaint has been withdrawn.');
      navigate('/dashboard/reports');
    } catch (caught) {
      toast.error(caught.message);
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Explore
      </Link>

      {/* Header */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
            {issue.complaintId}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
              copied
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
            aria-label="Copy complaint ID"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>

        <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-3xl">
          {issue.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          <CategoryBadge category={issue.category} />
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {issue.status === 'rejected' && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-rose-900">This complaint was rejected</p>
                <p className="mt-1 text-sm leading-relaxed text-rose-700">
                  {issue.rejectionReason || 'No reason was recorded by the reviewing officer.'}
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader title="Description" icon={FileText} />
            <CardBody>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {issue.description}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Photos"
              description={
                issue.photos?.length
                  ? `${issue.photos.length} attached photo${issue.photos.length === 1 ? '' : 's'}`
                  : 'No photos attached'
              }
              icon={Images}
            />
            <CardBody>
              <PhotoGallery photos={issue.photos} alt={issue.title} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Progress & activity" icon={Activity} />
            <CardBody>
              <StatusTimeline issue={issue} />
            </CardBody>
          </Card>

          {issue.status === 'resolved' && (
            <Card className="border-emerald-200">
              <CardHeader
                title="Resolution"
                description="How this issue was fixed"
                icon={BadgeCheck}
              />
              <CardBody className="space-y-5">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {issue.resolution?.note || 'This complaint was marked as resolved.'}
                </p>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="surface-muted p-3.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Resolved by
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-navy-900">
                      {issue.resolution?.resolvedByName || 'Municipal team'}
                    </dd>
                  </div>
                  <div className="surface-muted p-3.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Resolved on
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-navy-900">
                      {formatDateTime(issue.resolution?.resolvedAt || issue.resolvedAt)}
                    </dd>
                  </div>
                </dl>

                <PhotoGallery
                  photos={issue.resolution?.proofPhotos}
                  alt="Resolution proof"
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Location"
              description="Where this issue was reported"
              icon={MapPin}
            />
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {issue.location?.address || 'Address not provided'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {[issue.location?.area, issue.location?.city, issue.location?.pincode]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </div>

              <div className="surface-muted p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Exact coordinates
                </p>
                <p className="mt-0.5 font-mono text-sm font-medium text-navy-900">
                  {hasCoords ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Not available'}
                </p>
              </div>

              {marker && (
                <IssueMap
                  issues={[marker]}
                  height={300}
                  fitOnLoad
                  showLegend={false}
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Side column */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Community support
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-navy-900">
                {formatNumber(issue.upvoteCount ?? 0)}
              </span>
              <span className="text-sm text-slate-500">
                supporter{(issue.upvoteCount ?? 0) === 1 ? '' : 's'}
              </span>
            </div>

            <Button
              variant={issue.hasUpvoted ? 'primary' : 'outline'}
              size="lg"
              className="mt-4 w-full"
              onClick={handleUpvote}
              isLoading={isVoting}
              aria-pressed={issue.hasUpvoted}
            >
              <ArrowBigUp
                className={cn('h-5 w-5', issue.hasUpvoted && 'fill-current')}
                strokeWidth={2.4}
                aria-hidden="true"
              />
              {issue.hasUpvoted ? 'Supported' : 'Support this complaint'}
            </Button>

            {!isAuthenticated && (
              <p className="mt-2.5 text-center text-xs text-slate-400">
                Sign in to add your support.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Complaint details" icon={FileText} />
            <CardBody className="divide-y divide-slate-100 py-1">
              <DetailRow icon={MapPin} label="Location" value={locationLabel} />
              <DetailRow
                icon={Users}
                label="Reported by"
                value={issue.reportedBy?.name || 'Citizen'}
              />
              <DetailRow
                icon={Clock}
                label="Reported on"
                value={formatDateTime(issue.createdAt)}
              />
              <DetailRow
                icon={Activity}
                label="Last activity"
                value={timeAgo(issue.updatedAt || issue.lastActivityAt)}
              />
              <DetailRow
                icon={Building2}
                label="Assigned department"
                value={issue.assignedDepartment || 'Not yet assigned'}
              />
              <DetailRow
                icon={ShieldCheck}
                label="Assigned officer"
                value={issue.assignedTo?.name || 'Not yet assigned'}
              />
            </CardBody>
          </Card>

          {canManage && (
            <Card className="space-y-2.5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Manage your complaint
              </p>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={Pencil}
                onClick={openEdit}
              >
                Edit complaint
              </Button>
              <Button
                variant="dangerOutline"
                className="w-full"
                leftIcon={Trash2}
                onClick={() => setIsWithdrawOpen(true)}
              >
                Withdraw complaint
              </Button>
            </Card>
          )}
        </aside>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit complaint"
        description="You can update your complaint until it is acknowledged."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="edit-complaint-form" isLoading={isSaving}>
              Save changes
            </Button>
          </>
        }
      >
        {form && (
          <form id="edit-complaint-form" onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
              >
                {formError}
              </p>
            )}

            <Field label="Title" htmlFor="edit-title" required>
              <Input
                id="edit-title"
                value={form.title}
                maxLength={140}
                required
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>

            <Field label="Description" htmlFor="edit-description" required>
              <Textarea
                id="edit-description"
                rows={5}
                value={form.description}
                maxLength={2000}
                required
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="edit-category">
                <Select
                  id="edit-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Priority" htmlFor="edit-priority">
                <Select
                  id="edit-priority"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priority: event.target.value }))
                  }
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Address" htmlFor="edit-address">
              <Input
                id="edit-address"
                value={form.address}
                maxLength={240}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleWithdraw}
        title="Withdraw this complaint?"
        message="This will permanently delete your complaint and its photos. This action cannot be undone."
        confirmLabel="Withdraw complaint"
        isLoading={isWithdrawing}
        tone="danger"
      />
    </div>
  );
}
