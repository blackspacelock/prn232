interface LoadingDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
}

export function LoadingDialog({ isOpen, title, message }: LoadingDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="status" aria-live="polite">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--md3-primary-container)] border-t-[var(--md3-primary)]" />
        <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
        {message && <p className="mt-2 text-sm text-[var(--md3-on-surface-variant)]">{message}</p>}
      </div>
    </div>
  );
}
