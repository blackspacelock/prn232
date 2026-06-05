import { BookOpen, ExternalLink, GraduationCap, Newspaper, PlayCircle, Sparkles } from 'lucide-react';
import type { LearningResourceDto } from '@/types/api';

interface RoadmapResourceCardProps {
  resource: Pick<
    LearningResourceDto,
    'id' | 'name' | 'resourceUrl' | 'resourceType' | 'provider' | 'isFree'
  >;
  recommended?: boolean;
}

export function RoadmapResourceCard({ resource, recommended }: RoadmapResourceCardProps) {
  const type = resource.resourceType.toLowerCase();
  const Icon = type.includes('course')
    ? GraduationCap
    : type.includes('video') || type.includes('tutorial')
      ? PlayCircle
      : type.includes('article')
        ? Newspaper
        : BookOpen;

  return (
    <a
      href={resource.resourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4 transition-all hover:border-[var(--md3-status-in-progress-stroke)] hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--md3-surface-container)] text-[var(--md3-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--md3-on-surface)]">
            {resource.name}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-surface)]">
              {resource.resourceType}
            </span>
            {resource.provider && (
              <span className="rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">
                {resource.provider}
              </span>
            )}
            <span
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                resource.isFree
                  ? 'bg-[var(--md3-success-container)] text-[var(--md3-success)]'
                  : 'bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)]'
              }`}
            >
              {resource.isFree ? 'Free' : 'Paid'}
            </span>
            {recommended && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-warning-container)] px-2 py-1 text-xs font-medium text-[var(--md3-warning)]">
                <Sparkles className="h-3.5 w-3.5" />
                AI Pick
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--md3-primary)]">
          <ExternalLink className="h-4 w-4" />
        </span>
      </div>
    </a>
  );
}
