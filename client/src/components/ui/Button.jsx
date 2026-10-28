import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary:
    'bg-primary-700 text-white shadow-sm hover:bg-primary-800 active:bg-primary-900 disabled:bg-primary-300',
  accent:
    'bg-accent-600 text-white shadow-sm hover:bg-accent-700 active:bg-accent-800 disabled:bg-accent-300',
  outline:
    'border border-slate-300 bg-white text-navy-800 shadow-sm hover:border-slate-400 hover:bg-slate-50',
  subtle: 'bg-primary-50 text-primary-800 hover:bg-primary-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-navy-900',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800',
  dangerOutline:
    'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
  inverse: 'bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20',
};

const SIZES = {
  xs: 'h-8 gap-1.5 px-2.5 text-xs',
  sm: 'h-9 gap-2 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2.5 px-6 text-base',
  icon: 'h-10 w-10 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
};

/**
 * The single button primitive for the whole app.
 * Renders a `<button>` by default and accepts `as` for router links.
 */
export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    className,
    isLoading = false,
    loadingText,
    disabled,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;

  return (
    <Component
      ref={ref}
      {...(Component === 'button' ? { type, disabled: isDisabled } : {})}
      aria-busy={isLoading || undefined}
      aria-disabled={Component !== 'button' && isDisabled ? true : undefined}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children}
      {!isLoading && RightIcon && (
        <RightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
    </Component>
  );
});

export default Button;
