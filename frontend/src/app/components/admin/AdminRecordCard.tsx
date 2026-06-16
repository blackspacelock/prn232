import type { ReactNode } from 'react';

interface AdminRecordCardProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function AdminRecordCard({ eyebrow, title, description, actions }: AdminRecordCardProps) {
  return (
    <article className="admin-panel p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 flex flex-wrap items-center gap-2">{eyebrow}</div>}
          <h3 className="text-base font-semibold text-[var(--md3-on-surface)]">{title}</h3>
          {description && <div className="mt-1 text-sm leading-6 text-[var(--md3-on-surface-variant)]">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </article>
  );
}
