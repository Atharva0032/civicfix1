import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cn } from '../../lib/cn';

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4', text: 'text-base' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5', text: 'text-lg' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6', text: 'text-2xl' },
};

/** CivicFix wordmark: gradient map-pin tile + "Civic**Fix**". */
export function Logo({ to = '/', size = 'md', variant = 'dark', showTagline = false, className }) {
  const dimensions = SIZES[size] || SIZES.md;

  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="CivicFix home"
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-sm transition group-hover:shadow-card-hover',
          dimensions.box,
        )}
      >
        <MapPin className={dimensions.icon} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            'block font-display font-extrabold tracking-tight',
            dimensions.text,
            variant === 'light' ? 'text-white' : 'text-navy-900',
          )}
        >
          Civic
          <span className={variant === 'light' ? 'text-accent-300' : 'text-primary-600'}>
            Fix
          </span>
        </span>
        {showTagline && (
          <span
            className={cn(
              'block text-[10px] font-semibold uppercase tracking-[0.14em]',
              variant === 'light' ? 'text-white/60' : 'text-slate-400',
            )}
          >
            Report · Track · Fix
          </span>
        )}
      </span>
    </Link>
  );
}

export default Logo;
