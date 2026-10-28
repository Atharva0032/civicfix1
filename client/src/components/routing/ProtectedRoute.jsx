import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, EmptyState, Button } from '../ui';
import { Link } from 'react-router-dom';

/**
 * Route guard. `requireAdmin` additionally enforces the administrator role —
 * the real authorization always happens on the server; this only prevents
 * citizens from seeing broken pages.
 */
export function ProtectedRoute({ requireAdmin = false }) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={ShieldAlert}
          title="Administrator access required"
          description="This area is limited to municipal administrators. If you believe this is a mistake, contact the civic IT helpdesk."
          action={
            <Button as={Link} to="/dashboard">
              Back to my dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return <Outlet />;
}

/** Redirects already signed-in users away from /login and /register. */
export function PublicOnlyRoute() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) return <PageLoader label="Checking your session…" />;
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;

  return <Outlet />;
}

export default ProtectedRoute;
