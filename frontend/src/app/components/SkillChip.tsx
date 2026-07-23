import { X } from 'lucide-react';
import { getSkillColor, hashLabel } from './skillColorUtils';

interface SkillChipProps {
  label: string;
  /** Override the auto-derived color index. */
  colorIndex?: number;
  /** If provided, renders a remove (×) button. */
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export function SkillChip({ label, colorIndex, onRemove, size = 'md' }: SkillChipProps) {
  const idx = colorIndex !== undefined ? colorIndex : hashLabel(label);
  const { bg, text, border } = getSkillColor(idx);

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 min-h-9 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border font-medium ${padding} ${bg} ${text} ${border}`}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
