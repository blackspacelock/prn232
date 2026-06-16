import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

interface AdminDetailDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  eyebrow: string;
  icon: LucideIcon;
  badge?: string;
  onClose: () => void;
  children: ReactNode;
  asideHeader: ReactNode;
  aside: ReactNode;
  closeLabel?: string;
}

export function AdminDetailDialog({
  isOpen,
  title,
  description,
  eyebrow,
  icon: Icon,
  badge,
  onClose,
  children,
  asideHeader,
  aside,
  closeLabel = 'Close detail',
}: AdminDetailDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="relative grid h-[88vh] w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_420px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-[var(--md3-surface-variant)]"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5 text-[var(--md3-on-surface-variant)]" />
        </button>
        <div className="flex min-w-0 items-center border-b border-[var(--md3-outline-variant)] bg-white px-5 py-4 pr-16">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-semibold text-[var(--md3-primary)]">
                <Icon className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              {badge && (
                <span className="rounded-md bg-[var(--md3-surface-container)] px-2 py-1 text-xs text-[var(--md3-on-surface-variant)]">
                  {badge}
                </span>
              )}
            </div>
            <h2 className="truncate text-xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--md3-on-surface-variant)]">{description}</p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col border-l border-b border-[var(--md3-outline-variant)] bg-white p-5 pr-16">
          {asideHeader}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#fafafa]">
          {children}
        </div>

        <aside className="flex min-h-0 min-w-0 flex-col border-l border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)]">
          {aside}
        </aside>
      </div>
    </div>
  );
}

interface AdminInspectorSectionProps {
  title: string;
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function AdminInspectorSection({
  title,
  meta,
  className = '',
  children,
}: AdminInspectorSectionProps) {
  return (
    <section className={`rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-[var(--md3-on-surface)]">{title}</h4>
        {meta}
      </div>
      {children}
    </section>
  );
}
