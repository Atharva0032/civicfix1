import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, PlusCircle, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from './Logo';
import { Button } from '../ui/Button';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { publicNav } from '../../lib/navigation';

/** Sticky marketing/navigation bar for every public page. */
export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo size="md" />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Button
                as={Link}
                to="/report"
                size="sm"
                leftIcon={PlusCircle}
                className="hidden sm:inline-flex"
              >
                Report an Issue
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Get started
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/report"
              className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary-700 px-3 py-2.5 text-sm font-semibold text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Report an Issue
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to={isAdmin ? '/admin' : '/dashboard'}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                {isAdmin ? 'Admin dashboard' : 'My dashboard'}
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;
