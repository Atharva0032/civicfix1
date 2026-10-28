import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BellRing,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button, Field, Input } from '../../components/ui';
import { Logo } from '../../components/layout/Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIGHLIGHTS = [
  {
    icon: MapPin,
    text: 'Report a civic issue with an exact map pin in under a minute.',
  },
  {
    icon: BellRing,
    text: 'Track every complaint from submission all the way to resolution.',
  },
  {
    icon: ShieldCheck,
    text: 'Verified municipal departments own and close out every fix.',
  },
];

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@civicfix.dev', password: 'CivicFix@123' },
  { role: 'Citizen', email: 'ananya@civicfix.dev', password: 'CivicFix@123' },
];

export default function LoginPage() {
  useDocumentTitle('Sign in');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
  };

  const useDemoAccount = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
    setFormError('');
  };

  const validate = () => {
    const next = {};
    const email = form.email.trim();
    if (!email) next.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const signedIn = await login({ email: form.email.trim(), password: form.password });
      toast.success('Signed in successfully.', { title: 'Welcome back' });
      const fallback = signedIn?.role === 'admin' ? '/admin' : '/dashboard';
      navigate(location.state?.from ?? fallback, { replace: true });
    } catch (error) {
      const message = error?.message || 'We could not sign you in. Please try again.';
      setFormError(message);
      toast.error(message, { title: 'Sign in failed' });
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
            Welcome back to CivicFix
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            One place to report a pothole, a broken streetlight or an overflowing bin —
            and to watch it get fixed.
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
            <h2 className="font-display text-2xl font-extrabold text-navy-900">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Access your complaints, live updates and notifications.
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
              <Field label="Email" htmlFor="login-email" error={errors.email} required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-email"
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

              <Field label="Password" htmlFor="login-password" error={errors.password} required>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
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

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                loadingText="Signing you in…"
                leftIcon={LogIn}
              >
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to CivicFix?{' '}
              <Link to="/register" className="link">
                Create an account
              </Link>
            </p>
          </div>

          <div className="surface mt-5 p-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
              Demo credentials
            </p>
            <ul className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.email}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-800">{account.role}</p>
                    <p className="truncate font-mono text-[11px] text-slate-500">
                      {account.email} · {account.password}
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => useDemoAccount(account)}
                    aria-label={`Use the ${account.role} demo account`}
                  >
                    Use these
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
