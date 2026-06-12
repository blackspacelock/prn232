import { X } from 'lucide-react';

const SKILL_COLORS = [
  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200'  },
  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200'  },
  { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200'    },
  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200'    },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
];

export function hashLabel(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

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
  const { bg, text, border } = SKILL_COLORS[idx % SKILL_COLORS.length];

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
