import type { ElementType, ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface AppToastOptions {
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const toastStyles: Record<ToastVariant, { accent: string; icon: ElementType }> = {
  success: { accent: '#4CAF50', icon: CheckCircle2 },
  error: { accent: '#FF5252', icon: AlertCircle },
  info: { accent: '#4285F4', icon: Info },
  warning: { accent: '#FBBC04', icon: AlertTriangle },
};

function renderToastContent({
  variant,
  message,
  options,
  onDismiss,
}: {
  variant: ToastVariant;
  message: string;
  options?: AppToastOptions;
  onDismiss: () => void;
}) {
  const Icon = toastStyles[variant].icon;
  const title = options?.title ?? message;

  return (
    <div className="flex min-w-[360px] max-w-[520px] overflow-hidden rounded bg-[var(--md3-on-surface)] text-white shadow-lg">
      <div className="w-1 shrink-0" style={{ backgroundColor: toastStyles[variant].accent }} />
      <div className="flex flex-1 items-start gap-3 px-4 py-3.5">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: toastStyles[variant].accent }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5">{title}</p>
          {options?.description && (
            <div className="mt-1 text-xs leading-5 text-white/72">{options.description}</div>
          )}
        </div>
        {options?.actionLabel && options.onAction && (
          <button
            type="button"
            onClick={() => {
              options.onAction?.();
              onDismiss();
            }}
            className="rounded-full px-3 py-1 text-xs font-medium text-[#80BAFF] hover:bg-white/10"
          >
            {options.actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function showToast(variant: ToastVariant, message: string, options?: AppToastOptions) {
  return toast.custom(
    (toastId) => renderToastContent({
      variant,
      message,
      options,
      onDismiss: () => toast.dismiss(toastId),
    }),
    {
      duration: options?.duration ?? 3000,
    },
  );
}

export const appToast = {
  success: (message: string, options?: AppToastOptions) => showToast('success', message, options),
  error: (message: string, options?: AppToastOptions) => showToast('error', message, options),
  info: (message: string, options?: AppToastOptions) => showToast('info', message, options),
  warning: (message: string, options?: AppToastOptions) => showToast('warning', message, options),
  dismiss: toast.dismiss,
};
