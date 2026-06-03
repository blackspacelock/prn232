import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { AlertCircle, ArrowRight, Map as MapIcon, Sparkles } from 'lucide-react';
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
    <div className="space-y-3">
      {visibleRoadmaps.map((roadmap) => (
        <Link
          key={roadmap.id}
          to={getRoadmapDetailPath(roadmap.id)}
          className="md3-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--md3-primary-container)]">
            <MapIcon className="h-5 w-5 text-[var(--md3-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-sm font-semibold text-[var(--md3-on-surface)]">
                {roadmap.name}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)] shrink-0">
                {roadmap.isCustom ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Custom
                  </>
                ) : (
                  'Default'
                )}
              </span>
            </div>
            {roadmap.description && (
              <p className="text-xs text-[var(--md3-on-surface-variant)] line-clamp-2">
                {roadmap.description}
              </p>
            )}
          </div>
          <ArrowRight className="h-5 w-5 text-[var(--md3-on-surface-variant)] group-hover:text-[var(--md3-primary)] transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}
