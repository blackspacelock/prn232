import { ActionButton } from './ActionButton';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-[var(--md3-outline)] bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--md3-surface-variant)]">
        <Icon className="h-8 w-8 text-[var(--md3-outline)]" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-[var(--md3-on-surface)]">{title}</h2>
      <p className="mx-auto mb-5 max-w-sm text-sm text-[var(--md3-on-surface-variant)]">{description}</p>
      {actionLabel && onAction && (
        <ActionButton icon={Icon} label={actionLabel} variant="primary" size="md" onClick={onAction} />
      )}
    </div>
  );
}
