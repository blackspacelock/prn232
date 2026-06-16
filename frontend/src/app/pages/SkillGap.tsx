import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Download, SlidersHorizontal } from 'lucide-react';
import { ActionButton } from '../components/ActionButton';
import { SkillChip, getSkillCategoryColorIndex } from '../components/SkillChip';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@apollo/client/react';
import { useAuthStore } from '@/store/authStore';
import {
  GET_SKILL_GAP_ANALYSIS,
  GET_TRENDING_SKILL_RECOMMENDATIONS,
} from '@/graphql/queries';
import type { SkillGapAnalysisDto } from '@/types/api';

export function SkillGapPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const { data: skillGapData, loading: skillGapLoading, error: skillGapError, refetch } = useQuery(GET_SKILL_GAP_ANALYSIS, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: trendingData, loading: trendingLoading } = useQuery(GET_TRENDING_SKILL_RECOMMENDATIONS, {
    variables: { profileId },
    skip: !profileId,
  });

  const skillGap: SkillGapAnalysisDto | null = (skillGapData as { skillGapAnalysis?: SkillGapAnalysisDto })?.skillGapAnalysis ?? null;
  const trendingSkills: string[] = (trendingData as { trendingSkillRecommendations?: string[] })?.trendingSkillRecommendations ?? [];

  return (
    <AppShell breadcrumb="Skill Gap Analysis">
      <div className="app-page">
        <PageHeader
          title="Skill Gap Analysis"
          description="See exactly where you stand against your target role."
          actions={<ActionButton icon={Download} label="Export PDF" variant="neutral" size="md" onClick={() => window.print()} />}
        />

        {skillGapLoading ? (
          <div className="desktop-grid-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : skillGapError ? (
          <EmptyState icon={SlidersHorizontal} title="Failed to load analysis" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : !skillGap ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="No active roadmap"
            description="Set a roadmap as active to see your skill gap analysis."
            actionLabel="Go to Roadmaps"
            onAction={() => navigate('/roadmaps')}
          />
        ) : (
          <div className="desktop-grid-2">
            <div className="md3-card p-6">
              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Skill Coverage</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-6">Your skills vs. role requirements, by category</p>

              <div className="h-[320px] flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillGap.categoryBreakdown}>
                    <PolarGrid stroke="#E8EAED" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#5F6368' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Your Skills" dataKey="yourLevel" stroke="#1A73E8" fill="rgba(26,115,232,0.2)" strokeWidth={2} />
                    <Radar name="Required" dataKey="requiredLevel" stroke="#FBBC04" fill="rgba(251,188,4,0.15)" strokeWidth={2} strokeDasharray="5 5" />
                    <Legend />
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
              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Skills You Have</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
                {skillGap.matchedSkills.length} of {skillGap.requiredSkills.length} required skills covered
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {skillGap.matchedSkills.length > 0 ? (
                  skillGap.matchedSkills.map((skill) => (
                    <SkillChip key={skill.id} label={skill.name} colorIndex={getSkillCategoryColorIndex(skill.category)} size="sm" />
                  ))
                ) : (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No required skills matched yet.</p>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Missing Skills</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">{skillGap.missingSkills.length} skills to develop</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {skillGap.missingSkills.length > 0 ? (
                  skillGap.missingSkills.map((skill) => (
                    <SkillChip key={skill.id} label={skill.name} colorIndex={getSkillCategoryColorIndex(skill.category)} size="sm" />
                  ))
                ) : (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">You're covering every required skill.</p>
                )}
              </div>

              {!trendingLoading && trendingSkills.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">Trending Recommendations</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSkills.map((skill) => (
                      <SkillChip key={skill} label={skill} size="sm" />
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
