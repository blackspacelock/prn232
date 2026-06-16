import { useState } from 'react';
import { ChevronDown, ChevronUp, GitBranch, ListTree, Trophy } from 'lucide-react';
import { ActiveBadge } from '../ActiveBadge';

interface RoadmapCanvasHeaderProps {
  title: string;
  description?: string;
  nodeCount: number;
  levelCount?: number;
  isActive?: boolean;
  progress?: {
    completed: number;
    total: number;
  };
}

export function RoadmapCanvasHeader({
  title,
  description,
  nodeCount,
  levelCount,
  isActive,
  progress,
}: RoadmapCanvasHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pointer-events-none absolute left-5 top-5 z-10 w-[min(380px,calc(100%-40px))] text-left">
      <div className="pointer-events-auto rounded-lg border border-[var(--md3-outline-variant)] bg-white/95 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={!collapsed}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--md3-on-surface)]">
              {title}
            </span>
            {collapsed && (
              <span className="mt-0.5 block text-xs text-[var(--md3-on-surface-variant)]">
                {nodeCount} nodes
              </span>
            )}
          </span>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" />
          )}
        </button>

        {!collapsed && (
          <div className="border-t border-[var(--md3-outline-variant)] px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {isActive && <ActiveBadge />}
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">
                <GitBranch className="h-3.5 w-3.5" />
                {nodeCount} nodes
              </span>
              {typeof levelCount === 'number' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-surface-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                  <ListTree className="h-3.5 w-3.5" />
                  {levelCount} levels
                </span>
              )}
              {progress && progress.total > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-success-container)] px-2 py-1 text-xs font-medium text-[var(--md3-success)]">
                  <Trophy className="h-3.5 w-3.5" />
                  {progress.completed}/{progress.total} complete
                </span>
              )}
            </div>
            {description && (
              <p className="line-clamp-3 text-sm leading-5 text-[var(--md3-on-surface-variant)]">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
