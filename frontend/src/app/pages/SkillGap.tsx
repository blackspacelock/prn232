import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Download, SlidersHorizontal } from 'lucide-react';
import { ActionButton } from '../components/ActionButton';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useAuthStore } from '@/store/authStore';
import {
  GET_SKILL_GAP_ANALYSIS,
  GET_TRENDING_SKILL_RECOMMENDATIONS,
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
} from '@/graphql/queries';

interface SkillGapResult {
  profileId: string;
  careerRoadmapId: string;
  existingSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  coveragePercentage: number;
  summary: string;
}

export function SkillGapPage() {
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);

  const { data: roadmapsData } = useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: skillGapData, loading: skillGapLoading, error: skillGapError, refetch } = useQuery(GET_SKILL_GAP_ANALYSIS, {
    variables: { profileId, careerRoadmapId: selectedRoadmapId },
    skip: !profileId || !selectedRoadmapId,
  });

  const [loadSkillGap] = useLazyQuery(GET_SKILL_GAP_ANALYSIS);

  const { data: trendingData, loading: trendingLoading } = useQuery(GET_TRENDING_SKILL_RECOMMENDATIONS, {
    variables: { profileId },
    skip: !profileId,
  });

  const roadmaps = (roadmapsData as any)?.personalRoadmapsByProfile ?? [];

  useEffect(() => {
    if (roadmaps.length > 0 && !selectedRoadmapId) {
      setSelectedRoadmapId(roadmaps[0].careerRoadmapId);
    }
  }, [roadmaps, selectedRoadmapId]);
  const skillGap: SkillGapResult | null = (skillGapData as any)?.skillGapAnalysis ?? null;
  const trendingSkills: string[] = (trendingData as any)?.trendingSkillRecommendations ?? [];

  const radarData = skillGap
    ? [
        ...(skillGap.existingSkills as string[]).slice(0, 3).map((skill) => ({ skill, current: 100, required: 100 })),
        ...(skillGap.missingSkills as string[]).slice(0, 3).map((skill) => ({ skill, current: 0, required: 100 })),
      ]
    : [];

  const handleRoadmapChange = (careerRoadmapId: string) => {
    setSelectedRoadmapId(careerRoadmapId);
    loadSkillGap({ variables: { profileId, careerRoadmapId } });
  };

  return (
    <AppShell breadcrumb="Skill Gap Analysis">
      <div className="app-page">
        <PageHeader
          title="Skill Gap Analysis"
          description="See exactly where you stand against your target role."
          actions={<ActionButton icon={Download} label="Export PDF" variant="neutral" size="md" />}
        />

        {roadmaps.length > 0 && (
          <div className="md3-card p-4">
            <div className="flex flex-wrap gap-2">
              {roadmaps.map((rm: { id: string; careerRoadmapId: string; createdAt: string }) => (
                <button
                  key={rm.id}
                  onClick={() => handleRoadmapChange(rm.careerRoadmapId)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedRoadmapId === rm.careerRoadmapId
                      ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-primary)]'
                      : 'border-[var(--md3-outline)] hover:border-[var(--md3-on-surface-variant)]'
                  }`}
                >
                  {new Date(rm.createdAt).toLocaleDateString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {skillGapLoading ? (
          <div className="desktop-grid-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : skillGapError ? (
          <EmptyState icon={SlidersHorizontal} title="Failed to load analysis" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : !skillGap ? (
          <EmptyState icon={SlidersHorizontal} title="No roadmap selected" description="Generate a personal roadmap first to see your skill gap analysis." actionLabel="Go to Roadmaps" onAction={() => {}} />
        ) : (
          <div className="desktop-grid-2">
            <div className="md3-card p-6">
              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Skill Coverage</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-6">Your skills vs. role requirements</p>

              <div className="h-[280px] flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E8EAED" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#5F6368' }} />
                    <Radar name="Your Skills" dataKey="current" stroke="#1A73E8" fill="#1A73E8" fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Required" dataKey="required" stroke="#FBBC04" fill="#FBBC04" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-1" style={{ color: skillGap.coveragePercentage >= 70 ? 'var(--md3-success)' : 'var(--md3-error)' }}>
                  {Math.round(skillGap.coveragePercentage)}%
                </div>
                <p className="text-sm font-medium text-[var(--md3-on-surface-variant)]">of required skills matched</p>
              </div>
              <p className="text-sm text-[var(--md3-on-surface-variant)]">{skillGap.summary}</p>
            </div>

            <div className="md3-card p-6">
              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Missing Skills</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">{skillGap.missingSkills.length} skills to develop</p>

              <div className="space-y-2 mb-6">
                {skillGap.missingSkills.map((skill) => (
                  <div key={skill} className="flex items-center justify-between p-3 bg-[var(--md3-surface-container)] rounded-lg">
                    <span className="text-sm font-medium text-[var(--md3-on-surface)]">{skill}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--md3-error-container)] text-[var(--md3-error)]">Missing</span>
                  </div>
                ))}
              </div>

              {!trendingLoading && trendingSkills.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">Trending Recommendations</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSkills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded-lg text-xs font-medium">{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

