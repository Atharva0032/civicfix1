import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck, User } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../lib/format';

/** Avatar + account dropdown shared by the public navbar and the dashboard topbar. */
export function UserMenu({ variant = 'dark', align = 'right' }) {
  const { user, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 transition',
          variant === 'light'
            ? 'text-white hover:bg-white/10'
            : 'text-navy-800 hover:bg-slate-100',
        )}
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
          {user.name.split(' ')[0]}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-navy-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                isAdmin
                  ? 'bg-accent-50 text-accent-700'
                  : 'bg-primary-50 text-primary-700',
              )}
            >
              {isAdmin && <ShieldCheck className="h-3 w-3" />}
              {isAdmin ? 'Administrator' : 'Citizen'}
            </span>
          </div>

          <div className="p-1.5">
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-navy-900"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-400" />
              {isAdmin ? 'Admin dashboard' : 'My dashboard'}
            </Link>
            {!isAdmin && (
              <Link
                to="/dashboard/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-navy-900"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile settings
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
