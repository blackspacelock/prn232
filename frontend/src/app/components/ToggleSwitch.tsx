interface ToggleSwitchProps {
  checked: boolean;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onChange: () => void;
  className?: string;
  activeTone?: 'primary' | 'success';
  'aria-label'?: string;
}

export function ToggleSwitch({
  checked,
  label,
  disabled = false,
  loading = false,
  loadingLabel,
  onChange,
  className = '',
  activeTone = 'primary',
  'aria-label': ariaLabel,
}: ToggleSwitchProps) {
  const activeClasses =
    activeTone === 'success'
      ? 'border-[var(--md3-success)] bg-[var(--md3-success-container)] text-[var(--md3-success)]'
      : 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-primary)]';

  const trackClass =
    activeTone === 'success' && checked
      ? 'bg-[var(--md3-success)]'
      : checked
        ? 'bg-[var(--md3-primary)]'
        : 'bg-[var(--md3-outline)]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled || loading}
      onClick={onChange}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md3-primary)] disabled:cursor-not-allowed ${
        checked
          ? activeClasses
          : 'border-[var(--md3-outline)] bg-white text-[var(--md3-on-surface-variant)] hover:border-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)] hover:text-[var(--md3-primary)] disabled:opacity-50'
      } ${className}`}
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${trackClass}`} aria-hidden="true">
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
      <span>{loading && loadingLabel ? loadingLabel : label}</span>
    </button>
  );
}
