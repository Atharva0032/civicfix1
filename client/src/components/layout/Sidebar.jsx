import { NavLink } from 'react-router-dom';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { initials } from '../../lib/format';
import { adminNav, citizenNav } from '../../lib/navigation';

/** Dark navigation rail used by both dashboards. */
export function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const { unread } = useNotifications();
  const items = isAdmin ? adminNav : citizenNav;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-900 text-white transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo size="sm" variant="light" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="flex items-center gap-1 truncate text-[11px] font-semibold uppercase tracking-wide text-accent-300">
              {isAdmin && <ShieldCheck className="h-3 w-3" />}
              {isAdmin ? 'Administrator' : 'Citizen'}
            </p>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
          {items.map((item) => {
            const Icon = item.icon;
            const badgeCount = item.badge === 'unread' ? unread : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-gradient-to-r from-primary-600/90 to-primary-500/60 text-white shadow-inset'
                      : 'text-white/70 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                <span className="flex-1 truncate">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {item.accent && !badgeCount && (
                  <span className="rounded-md bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-300">
                    New
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-rose-500/15 hover:text-rose-200"
          >
            <LogOut className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            Sign out
          </button>
          <p className="px-3 pt-2 text-[10px] leading-relaxed text-white/35">
            CivicFix demo build · seeded development accounts
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
