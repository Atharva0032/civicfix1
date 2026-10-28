import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BellRing,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { Button, Checkbox, Field, Input } from '../../components/ui';
import { Logo } from '../../components/layout/Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { cn } from '../../lib/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIGHLIGHTS = [
  { icon: MapPin, text: 'File a report with photos and an exact location pin.' },
  { icon: BellRing, text: 'Get notified the moment your complaint moves forward.' },
  { icon: ShieldCheck, text: 'Every report is routed to the right municipal department.' },
];

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'letter', label: 'Contains a letter', test: (value) => /[A-Za-z]/.test(value) },
  { key: 'number', label: 'Contains a number', test: (value) => /\d/.test(value) },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  accepted: false,
};

export default function RegisterPage() {
  useDocumentTitle('Create an account');

  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ruleStatus = useMemo(
    () => RULES.map((rule) => ({ ...rule, met: rule.test(form.password) })),
    [form.password],
  );
  const passwordIsValid = ruleStatus.every((rule) => rule.met);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) next.name = 'Enter your full name.';
    else if (name.length < 2) next.name = 'Your name must be at least 2 characters.';
    else if (name.length > 80) next.name = 'That name is too long.';

    if (!email) next.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';

    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 7) {
      next.phone = 'Enter a valid phone number or leave it blank.';
    }

    if (!form.password) next.password = 'Choose a password.';
    else if (!passwordIsValid) next.password = 'Your password does not meet the requirements below.';

    if (!form.confirmPassword) next.confirmPassword = 'Re-enter your password.';
    else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Both passwords must match.';
    }

    if (!form.accepted) next.accepted = 'Please accept the terms to continue.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      toast.success('Welcome to CivicFix!', { title: 'Account created' });
      navigate('/dashboard', { replace: true });
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

      const message =
        error?.status === 409
          ? 'An account already exists for this email address. Try signing in instead.'
          : error?.message || 'We could not create your account. Please try again.';
      setFormError(message);
      toast.error(message, { title: 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-pattern absolute inset-0 opacity-[0.12]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <Logo variant="light" size="lg" showTagline />
          <h1 className="mt-14 font-display text-4xl font-extrabold leading-tight text-white">
            Join your city’s
            <br />
            civic network
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Create a free citizen account to report issues and follow every fix from
            start to finish.
          </p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-accent-300 ring-1 ring-inset ring-white/15">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="pt-1 text-sm leading-relaxed text-white/80">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
          Report It. Track It. Fix It.
        </p>
      </aside>

      {/* Form column */}
      <main className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" showTagline />
          </div>

          <div className="surface p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold text-navy-900">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Takes less than a minute. No documents required.
            </p>

            {formError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <Field label="Full name" htmlFor="register-name" error={errors.name} required>
                <div className="relative">
                  <UserPlus className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ananya Deshpande"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    invalid={Boolean(errors.name)}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field label="Email" htmlFor="register-email" error={errors.email} required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    invalid={Boolean(errors.email)}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field
                label="Phone"
                htmlFor="register-phone"
                hint="Optional — used only for urgent municipal updates."
                error={errors.phone}
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="register-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    invalid={Boolean(errors.phone)}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field label="Password" htmlFor="register-password" error={errors.password} required>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    invalid={Boolean(errors.password)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </Field>

              <ul className="grid gap-1.5 sm:grid-cols-3" aria-live="polite">
                {ruleStatus.map((rule) => (
                  <li
                    key={rule.key}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium',
                      rule.met ? 'text-emerald-600' : 'text-slate-400',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-4 w-4 place-items-center rounded-full border',
                        rule.met
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white',
                      )}
                    >
                      {rule.met && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>

              <Field
                label="Confirm password"
                htmlFor="register-confirm"
                error={errors.confirmPassword}
                required
              >
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="register-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(event) => update('confirmPassword', event.target.value)}
                    invalid={Boolean(errors.confirmPassword)}
                    className="pl-10"
                  />
                </div>
              </Field>

              <div>
                <Checkbox
                  id="register-terms"
                  checked={form.accepted}
                  onChange={(event) => update('accepted', event.target.checked)}
                  label="I agree to CivicFix’s terms of use and understand that confirmed reports may be shared with the municipal corporation."
                />
                {errors.accepted && (
                  <p className="field-error" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {errors.accepted}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                loadingText="Creating your account…"
                leftIcon={UserPlus}
              >
                Create account
              </Button>
            </form>

            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
              Administrator accounts are provisioned by the municipal corporation and
              cannot be self-registered.
            </p>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
