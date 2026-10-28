import { Link } from 'react-router-dom';
import {
  Github,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from './Logo';
import { publicNav } from '../../lib/navigation';

const RESOURCE_LINKS = [
  { to: '/explore', label: 'Browse complaints' },
  { to: '/map', label: 'Interactive city map' },
  { to: '/how-it-works', label: 'How CivicFix works' },
  { to: '/report', label: 'Report an issue' },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <Logo size="md" showTagline />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            CivicFix connects citizens with their municipal corporation. Report a pothole,
            an overflowing bin or a broken streetlight — then follow it from submission to
            resolution with a transparent, public timeline.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Report It. Track It. Fix It.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
            Navigate
          </h3>
          <ul className="mt-4 space-y-2.5">
            {publicNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-slate-500 transition hover:text-primary-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
              <span>
                Municipal Corporation Civic Centre,
                <br />
                Ward Office Complex, Pune 411001
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary-500" />
              <a href="tel:+912025501000" className="transition hover:text-primary-700">
                +91 20 2550 1000
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-primary-500" />
              <a
                href="mailto:help@civicfix.dev"
                className="transition hover:text-primary-700"
              >
                help@civicfix.dev
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Github className="h-4 w-4 shrink-0 text-primary-500" />
              <span>Hackathon demonstration build</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} CivicFix. Built for civic good.</p>
          <p>
            Sample data only — development credentials from the seed script must never be
            used in production.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
