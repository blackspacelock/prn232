import {
  NODE_STATUS_COLORS,
  NODE_STATUS_VALUES,
  type NodeStatusInt,
} from '@/constants/nodeStatus';

interface NodeStatusPickerProps {
  value: NodeStatusInt;
  onChange: (status: NodeStatusInt) => void;
  disabled?: boolean;
}

export function NodeStatusPicker({ value, onChange, disabled = false }: NodeStatusPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {NODE_STATUS_VALUES.map((status) => {
        const colors = NODE_STATUS_COLORS[status];
        const isSelected = value === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            disabled={disabled}
            className="rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: isSelected ? colors.fill : 'transparent',
              color: isSelected ? colors.text : 'var(--md3-on-surface-variant)',
              borderColor: isSelected ? colors.stroke : 'var(--md3-outline)',
            }}
          >
            {colors.label}
          </button>
        );
      })}
    </div>
  );
}
