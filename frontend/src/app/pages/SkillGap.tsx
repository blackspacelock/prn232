import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Download, SlidersHorizontal } from 'lucide-react';
import { ActionButton } from '../components/ActionButton';
import { SkillChip, getSkillCategoryColorIndex } from '../components/SkillChip';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend, ResponsiveContainer,
} from 'recharts';
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
  const [showNoActiveRoadmapDialog, setShowNoActiveRoadmapDialog] = useState(false);

  const {
    data: skillGapData,
    loading: skillGapLoading,
    error: skillGapError,
    refetch: refetchSkillGap,
  } = useQuery(GET_SKILL_GAP_ANALYSIS, {
    variables: { profileId },
    skip: !profileId,
  });

  const {
    data: trendingData,
    loading: trendingLoading,
    refetch: refetchTrending,
  } = useQuery(GET_TRENDING_SKILL_RECOMMENDATIONS, {
    variables: { profileId },
    skip: !profileId,
  });

  const skillGap: SkillGapAnalysisDto | null =
    (skillGapData as { skillGapAnalysis?: SkillGapAnalysisDto })?.skillGapAnalysis ?? null;
  const trendingSkills: string[] =
    (trendingData as { trendingSkillRecommendations?: string[] })?.trendingSkillRecommendations ?? [];
  const hasNoActiveRoadmap = Boolean(profileId && !skillGapLoading && !skillGapError && !skillGap);

  useEffect(() => {
    if (hasNoActiveRoadmap) {
      setShowNoActiveRoadmapDialog(true);
    }
  }, [hasNoActiveRoadmap]);

  const handleAnalyse = () => {
    refetchSkillGap({ profileId });
    refetchTrending({ profileId });
  };

  const goToRoadmaps = () => {
    setShowNoActiveRoadmapDialog(false);
    navigate('/roadmaps');
  };

  const radarData = skillGap?.categoryBreakdown.map((c) => ({
    category: c.category,
    'Your Level': c.yourLevel,
    Required: c.requiredLevel,
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
                label={skillGapLoading ? 'Analysing...' : 'Re-analyse'}
                variant="primary"
                size="md"
                onClick={handleAnalyse}
                disabled={!profileId || skillGapLoading}
              />
              <ActionButton icon={Download} label="Export PDF" variant="neutral" size="md" onClick={() => window.print()} />
            </div>
          }
        />

        {skillGapLoading ? (
          <div className="desktop-grid-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : skillGapError ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Failed to load analysis"
            description="Please try again."
            actionLabel="Retry"
            onAction={handleAnalyse}
          />
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
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-6">
                Your skills vs. role requirements, by category
              </p>

              <div className="h-[320px] flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E8EAED" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#5F6368' }} />
                    <Radar
                      name="Your Skills"
                      dataKey="Your Level"
                      stroke="#1A73E8"
                      fill="#1A73E8"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Required"
                      dataKey="Required"
                      stroke="#FBBC04"
                      fill="#FBBC04"
                      fillOpacity={0.15}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center mb-4">
                <div
                  className="text-5xl font-bold mb-1"
                  style={{
                    color:
                      skillGap.coveragePercentage >= 70
                        ? 'var(--md3-success)'
                        : 'var(--md3-error)',
                  }}
                >
                  {Math.round(skillGap.coveragePercentage)}%
                </div>
                <p className="text-sm font-medium text-[var(--md3-on-surface-variant)]">
                  of required skills matched
                </p>
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
                    <SkillChip
                      key={skill.id}
                      label={skill.name}
                      colorIndex={getSkillCategoryColorIndex(skill.category)}
                      size="sm"
                    />
                  ))
                ) : (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No required skills matched yet.</p>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Missing Skills</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
                {skillGap.missingSkills.length} skills to develop
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {skillGap.missingSkills.length > 0 ? (
                  skillGap.missingSkills.map((skill) => (
                    <SkillChip
                      key={skill.id}
                      label={skill.name}
                      colorIndex={getSkillCategoryColorIndex(skill.category)}
                      size="sm"
                    />
                  ))
                ) : (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">
                    You're covering every required skill.
                  </p>
                )}
              </div>

              {!trendingLoading && trendingSkills.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                    Trending Recommendations
                  </h3>
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
      <ConfirmDialog
        isOpen={showNoActiveRoadmapDialog && hasNoActiveRoadmap}
        title="No active roadmap"
        message="You need to activate at least one roadmap before running skill gap analysis."
        confirmLabel="Go to Roadmaps"
        cancelLabel="Later"
        onConfirm={goToRoadmaps}
        onCancel={() => setShowNoActiveRoadmapDialog(false)}
      />
    </AppShell>
  );
}
