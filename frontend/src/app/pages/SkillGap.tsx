import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Download, SlidersHorizontal } from 'lucide-react';
import { ActionButton } from '../components/ActionButton';
import { SkillChip, getSkillCategoryColorIndex } from '../components/SkillChip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLazyQuery } from '@apollo/client/react';
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
  const [analysed, setAnalysed] = useState(false);

  const [fetchSkillGap, { data: skillGapData, loading: skillGapLoading, error: skillGapError }] = useLazyQuery(GET_SKILL_GAP_ANALYSIS);
  const [fetchTrending, { data: trendingData, loading: trendingLoading }] = useLazyQuery(GET_TRENDING_SKILL_RECOMMENDATIONS);

  const skillGap: SkillGapAnalysisDto | null = (skillGapData as { skillGapAnalysis?: SkillGapAnalysisDto })?.skillGapAnalysis ?? null;
  const trendingSkills: string[] = (trendingData as { trendingSkillRecommendations?: string[] })?.trendingSkillRecommendations ?? [];

  const handleAnalyse = () => {
    setAnalysed(true);
    fetchSkillGap({ variables: { profileId } });
    fetchTrending({ variables: { profileId } });
  };

  const chartData = skillGap?.categoryBreakdown.map((c) => ({
    category: c.category,
    'Your Level': c.yourLevel,
    'Required': c.requiredLevel,
  })) ?? [];

  return (
    <AppShell breadcrumb="Skill Gap Analysis">
      <div className="app-page">
        <PageHeader
          title="Skill Gap Analysis"
          description="See exactly where you stand against your target role."
          actions={
            <div className="flex items-center gap-2">
              <ActionButton
                icon={SlidersHorizontal}
                label={skillGapLoading ? 'Analysing...' : 'Analyse'}
                variant="primary"
                size="md"
                onClick={handleAnalyse}
                disabled={!profileId || skillGapLoading}
              />
              <ActionButton icon={Download} label="Export PDF" variant="neutral" size="md" onClick={() => window.print()} />
            </div>
          }
        />

        {!analysed ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Analyse your skill gap"
            description="Click the Analyse button to compare your skills against your active roadmap's requirements."
            actionLabel="Analyse now"
            onAction={handleAnalyse}
          />
        ) : skillGapLoading ? (
          <div className="desktop-grid-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : skillGapError ? (
          <EmptyState icon={SlidersHorizontal} title="Failed to load analysis" description="Please try again." actionLabel="Retry" onAction={handleAnalyse} />
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
                  <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#5F6368' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 12, fill: '#5F6368' }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="Your Level" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Required" fill="#FBBC04" radius={[4, 4, 0, 0]} />
                  </BarChart>
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
