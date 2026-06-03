import { NODE_STATUS_STYLES, type NodeStatus } from './statusStyles';

export type { NodeStatus };

interface StatusChipProps {
  status: NodeStatus;
  count?: number;
  label?: string;
}

export function StatusChip({ status, count, label }: StatusChipProps) {
  const styles = NODE_STATUS_STYLES[status];

  return (
    <span
      className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: styles.fill, borderColor: styles.stroke, color: styles.text }}
    >
      {count !== undefined ? `${count} ` : ''}
      {label ?? styles.label}
    </span>
  );
}
