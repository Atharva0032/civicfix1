import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const CONTROL_BASE =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-navy-900 shadow-sm transition ' +
  'placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500/30';

const stateClasses = (invalid) =>
  invalid
    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
    : 'border-slate-300 hover:border-slate-400 focus:border-primary-500';

export function Label({ htmlFor, children, required, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('field-label', className)}>
      {children}
      {required && (
        <span className="ml-0.5 text-rose-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

/** Label + control + hint/error, wired together with aria attributes. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
  id,
}) {
  const generatedId = useId();
  const controlId = htmlFor || id || generatedId;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <Label htmlFor={controlId} required={required}>
          {label}
        </Label>
      )}
      {typeof children === 'function' ? children(controlId) : children}
      {error ? (
        <p className="field-error" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { className, invalid, id, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      id={id}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, stateClasses(invalid), 'h-11', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, invalid, rows = 4, id, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, stateClasses(invalid), 'py-3 leading-relaxed', className)}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select(
  { className, invalid, id, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      id={id}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        stateClasses(invalid),
        'h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({ id, label, className, ...props }) {
  return (
    <label
      htmlFor={id}
      className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-slate-600', className)}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-primary-700 focus:ring-primary-500/40"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Segmented radio group used for priority and category pickers.
 * Keyboard accessible: arrow keys move between options.
 */
export function RadioCards({ name, value, onChange, options, columns = 2, className }) {
  return (
    <fieldset className={cn('grid gap-2.5', className)}>
      <legend className="sr-only">{name}</legend>
      <div
        className={cn(
          'grid gap-2.5',
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          columns === 4 && 'grid-cols-2 lg:grid-cols-4',
        )}
      >
        {options.map((option) => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition',
                selected
                  ? 'border-primary-500 bg-primary-50/60 shadow-glow'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer border-slate-300 text-primary-700 focus:ring-primary-500/40"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  {Icon && <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />}
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default Field;
