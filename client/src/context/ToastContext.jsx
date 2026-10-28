import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    wrap: 'border-emerald-200 bg-white',
    iconClass: 'text-emerald-600',
    title: 'text-emerald-900',
  },
  error: {
    icon: XCircle,
    wrap: 'border-rose-200 bg-white',
    iconClass: 'text-rose-600',
    title: 'text-rose-900',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'border-amber-200 bg-white',
    iconClass: 'text-amber-600',
    title: 'text-amber-900',
  },
  info: {
    icon: Info,
    wrap: 'border-primary-200 bg-white',
    iconClass: 'text-primary-600',
    title: 'text-navy-900',
  },
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, { title, duration } = {}) => {
      counter += 1;
      const id = counter;
      const toast = {
        id,
        variant,
        message,
        title: title || defaultTitle(variant),
      };
      setToasts((current) => [...current.slice(-4), toast]);

      const timeout = duration ?? (variant === 'error' ? 7000 : 4500);
      window.setTimeout(() => dismiss(id), timeout);
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[1200] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((item) => {
          const variant = VARIANTS[item.variant] || VARIANTS.info;
          const Icon = variant.icon;
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-card-hover animate-slide-in-right',
                variant.wrap,
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', variant.iconClass)} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', variant.title)}>{item.title}</p>
                <p className="mt-0.5 break-words text-sm text-slate-600">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const defaultTitle = (variant) =>
  ({
    success: 'Success',
    error: 'Something went wrong',
    warning: 'Heads up',
    info: 'Notice',
  })[variant] || 'Notice';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context.toast;
}

export default ToastContext;
