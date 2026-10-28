import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { Footer } from './Footer';

/**
 * Marketing/explore shell: sticky navbar, routed content, footer.
 * `ScrollToTop` behaviour is handled here so every navigation starts at the top.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
