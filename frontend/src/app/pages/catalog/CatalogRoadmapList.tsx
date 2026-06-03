import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { AlertCircle, ArrowRight, Clock3, Map as MapIcon, Sparkles } from 'lucide-react';
import { GET_CAREER_ROADMAPS_BY_ROLE } from '@/graphql/queries';
import { Skeleton } from '../../components/Skeleton';
import type { CareerRoadmapDto } from '@/types/api';

interface CatalogRoadmapListProps {
  roleId: string;
  getRoadmapDetailPath: (id: string) => string;
  limit?: number;
}

export function CatalogRoadmapList({
  roleId,
  getRoadmapDetailPath,
  limit,
}: CatalogRoadmapListProps) {
  const { data, loading, error } = useQuery(GET_CAREER_ROADMAPS_BY_ROLE, {
    variables: { careerRoleId: roleId },
    skip: !roleId,
  });
  const roadmaps: CareerRoadmapDto[] =
    (data as { careerRoadmapsByRole?: CareerRoadmapDto[] })?.careerRoadmapsByRole ?? [];
  const visibleRoadmaps = typeof limit === 'number' ? roadmaps.slice(0, limit) : roadmaps;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-8 w-8 text-[var(--md3-error)] mx-auto mb-2" />
        <p className="text-sm text-[var(--md3-on-surface-variant)]">
          Failed to load roadmap templates.
        </p>
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <p className="text-sm text-[var(--md3-on-surface-variant)] py-4">
        No roadmap templates available for this role yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {visibleRoadmaps.map((roadmap) => (
        <Link
          key={roadmap.id}
          to={getRoadmapDetailPath(roadmap.id)}
          className="group flex min-h-[154px] flex-col justify-between rounded-lg border border-[var(--md3-outline-variant)] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--md3-status-in-progress-stroke)] hover:shadow-md"
        >
          <div>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--md3-primary-container)]">
                <MapIcon className="h-5 w-5 text-[var(--md3-primary)]" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                {roadmap.isCustom ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Custom
                  </>
                ) : (
                  <>
                    <Clock3 className="h-3.5 w-3.5" />
                    Template
                  </>
                )}
              </span>
            </div>
            <h3 className="text-base font-semibold leading-tight text-[var(--md3-on-surface)]">
              {roadmap.name}
            </h3>
            {roadmap.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
                {roadmap.description}
              </p>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[var(--md3-outline-variant)] pt-4">
            <span className="text-sm font-medium text-[var(--md3-primary)]">Open roadmap</span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--md3-on-surface-variant)] transition-colors group-hover:text-[var(--md3-primary)]" />
          </div>
        </Link>
      ))}
    </div>
  );
}
