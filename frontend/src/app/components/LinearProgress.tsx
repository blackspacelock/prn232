interface LinearProgressProps {
  value: number;
  color?: string;
  heightClassName?: string;
}

export function LinearProgress({
  value,
  color = 'var(--md3-success)',
  heightClassName = 'h-1.5',
}: LinearProgressProps) {
  const normalized = Math.min(100, Math.max(0, value));

  return (
    <div className={`${heightClassName} overflow-hidden rounded-full bg-[var(--md3-outline-variant)]`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${normalized}%`, backgroundColor: color }}
      />
    </div>
  );
}
