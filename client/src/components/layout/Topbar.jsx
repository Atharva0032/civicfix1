import { useLocation } from 'react-router-dom';
import { Menu, PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../context/AuthContext';

const TITLES = [
  { match: /^\/dashboard$/, title: 'Overview' },
  { match: /^\/dashboard\/reports/, title: 'My Reports' },
  { match: /^\/dashboard\/notifications/, title: 'Notifications' },
  { match: /^\/dashboard\/profile/, title: 'Profile' },
  { match: /^\/admin$/, title: 'Municipal Dashboard' },
  { match: /^\/admin\/issues/, title: 'Complaint Management' },
  { match: /^\/admin\/departments/, title: 'Departments' },
  { match: /^\/admin\/citizens/, title: 'Citizens' },
  { match: /^\/admin\/analytics/, title: 'Analytics' },
  { match: /^\/admin\/notifications/, title: 'Notifications' },
  { match: /^\/report/, title: 'Report an Issue' },
  { match: /^\/issues\//, title: 'Complaint Details' },
];

const titleFor = (pathname) =>
  TITLES.find((entry) => entry.match.test(pathname))?.title ?? 'CivicFix';

/** Sticky dashboard header: mobile menu, current section, quick actions. */
export function Topbar({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-navy-900">
          {titleFor(pathname)}
        </h1>

        <div className="flex items-center gap-1.5">
          {!isAdmin && (
            <Button
              as={Link}
              to="/report"
              size="sm"
              leftIcon={PlusCircle}
              className="hidden sm:inline-flex"
            >
              Report an Issue
            </Button>
          )}
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
