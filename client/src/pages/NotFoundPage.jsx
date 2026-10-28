import { Link } from 'react-router-dom';
import { Compass, House, SearchX } from 'lucide-react';
import { Button } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Friendly fallback shown for any unknown route. */
export default function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-primary-50 text-primary-600 shadow-sm">
        <SearchX className="h-9 w-9" aria-hidden="true" />
      </span>

      <p className="mt-6 font-display text-6xl font-extrabold tracking-tight text-navy-900 sm:text-7xl">
        404
      </p>

      <h1 className="mt-3 font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">
        We couldn&rsquo;t find that page
      </h1>

      <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-500">
        The page you are looking for may have been moved, deleted, or never existed.
        Let&rsquo;s get you back to something useful.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/" size="lg" leftIcon={House}>
          Back to home
        </Button>
        <Button as={Link} to="/explore" size="lg" variant="outline" leftIcon={Compass}>
          Explore Issues
        </Button>
      </div>
    </div>
  );
}
