import { CheckCircle2 } from 'lucide-react';

interface ActiveBadgeProps {
  label?: string;
}

export function ActiveBadge({ label = 'Active' }: ActiveBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: 'var(--md3-success-container)',
        borderColor: 'var(--md3-success)',
        color: 'var(--md3-success)',
      }}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
