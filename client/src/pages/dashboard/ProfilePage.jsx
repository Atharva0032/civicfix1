import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Clock,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageLoader,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatDateTime, initials } from '../../lib/format';
import api from '../../lib/api';

const READ_ONLY_HINT = 'Email and role are managed by the municipal corporation.';

export default function ProfilePage() {
  useDocumentTitle('Profile');

  const navigate = useNavigate();
  const { user, isAdmin, logout, updateUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  if (!user) return <PageLoader label="Loading your profile…" />;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const name = form.name.trim();
    const next = {};
    if (name.length < 2) next.name = 'Enter your full name (at least 2 characters).';
    else if (name.length > 80) next.name = 'That name is too long.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setIsSaving(true);
    try {
      const { data } = await api.patch('/auth/me', {
        name,
        phone: form.phone.trim() || undefined,
      });
      updateUser(data.data.user);
      toast.success('Your profile has been updated.', { title: 'Saved' });
    } catch (error) {
      const details = Array.isArray(error?.details) ? error.details : [];
      if (details.length) {
        const mapped = {};
        details.forEach((detail) => {
          const field = detail.field || detail.path;
          const message = detail.message || detail.msg;
          if (field && message) mapped[field] = message;
        });
        setErrors(mapped);
      }
      setFormError(error?.message || 'We could not save your changes. Please try again.');
      toast.error(error?.message || 'We could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Profile</h1>
        <p className="text-sm text-slate-500">
          Manage how the municipal corporation reaches you about your complaints.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 font-display text-2xl font-extrabold text-white shadow-card">
              {initials(user.name)}
            </span>

            <h2 className="mt-4 font-display text-xl font-extrabold text-navy-900">
              {user.name}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {user.email}
            </p>

            <Badge
              className={
                isAdmin
                  ? 'mt-3 bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200'
                  : 'mt-3 bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200'
              }
            >
              {isAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isAdmin ? 'Administrator' : 'Citizen'}
            </Badge>

            <dl className="mt-6 w-full space-y-3.5 border-t border-slate-100 pt-5 text-left">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Member since
                </dt>
                <dd className="text-sm font-semibold text-navy-900">
                  {formatDate(user.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Last sign-in
                </dt>
                <dd className="text-sm font-semibold text-navy-900">
                  {formatDateTime(user.lastLoginAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Phone
                </dt>
                <dd className="text-sm font-semibold text-navy-900">{user.phone || '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              icon={User}
              title="Account details"
              description="Update your display name and contact number."
            />
            <CardBody className="space-y-5">
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="profile-name" error={errors.name} required>
                    <Input
                      id="profile-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => update('name', event.target.value)}
                      invalid={Boolean(errors.name)}
                    />
                  </Field>

                  <Field
                    label="Phone"
                    htmlFor="profile-phone"
                    error={errors.phone}
                    hint="Optional — used only for urgent updates."
                  >
                    <Input
                      id="profile-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      invalid={Boolean(errors.phone)}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Email" htmlFor="profile-email" hint={READ_ONLY_HINT}>
                    <Input
                      id="profile-email"
                      type="email"
                      value={user.email}
                      readOnly
                      className="cursor-not-allowed bg-slate-50 text-slate-500"
                    />
                  </Field>

                  <Field label="Role" htmlFor="profile-role" hint={READ_ONLY_HINT}>
                    <Input
                      id="profile-role"
                      type="text"
                      value={isAdmin ? 'Administrator' : 'Citizen'}
                      readOnly
                      className="cursor-not-allowed bg-slate-50 text-slate-500"
                    />
                  </Field>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    leftIcon={Save}
                    isLoading={isSaving}
                    loadingText="Saving…"
                    className="w-full sm:w-auto"
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={LogOut}
              title="Session"
              description="Sign out of CivicFix on this device."
            />
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-slate-500">
                You will need to sign in again to report or track issues.
              </p>
              <Button
                variant="dangerOutline"
                leftIcon={LogOut}
                onClick={handleSignOut}
                className="w-full sm:w-auto"
              >
                Sign out
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
