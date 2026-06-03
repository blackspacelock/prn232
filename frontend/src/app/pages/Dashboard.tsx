import { Link } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { ActionLink } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Compass, TrendingUp, Code, BarChart2, Rocket, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import { useQuery } from '@apollo/client/react';
import { useAuthStore } from '@/store/authStore';
import {
  GET_USER_BY_ID,
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
  GET_TOP_TRENDING_SKILLS,
  GET_GITHUB_REPOS_BY_PROFILE,
  GET_CHAT_SESSIONS_BY_PROFILE,
  GET_SKILL_GAP_ANALYSIS,
} from '@/graphql/queries';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const profileId = user?.profileId ?? '';

  const { data: userData, loading: userLoading, error: userError, refetch: refetchUser } = useQuery(GET_USER_BY_ID, {
    variables: { userId },
    skip: !userId,
  });

  const { data: roadmapsData, loading: roadmapsLoading, error: roadmapsError, refetch: refetchRoadmaps } = useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: topSkillsData } = useQuery(GET_TOP_TRENDING_SKILLS, {
    variables: { count: 6 },
  });

  const { data: githubData } = useQuery(GET_GITHUB_REPOS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: sessionsData } = useQuery(GET_CHAT_SESSIONS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const fullName = (userData as any)?.userById?.fullName ?? user?.email ?? 'there';
  const roadmaps = (roadmapsData as any)?.personalRoadmapsByProfile ?? [];
  const activeCount = roadmaps.length;
  const avgProgress = activeCount > 0
    ? Math.round(roadmaps.reduce((sum: number, r: { progressPercentage: number }) => sum + r.progressPercentage, 0) / activeCount)
    : 0;

  const topSkills: Array<{ techSkill: string; trendScore: number }> = (topSkillsData as any)?.topTrendingSkills ?? [];
  const topSkillName = topSkills[0]?.techSkill ?? '—';
  const trendChartData = topSkills.map((s) => ({ name: s.techSkill, score: s.trendScore }));

  const githubRepoCount = ((githubData as any)?.gitHubRepositoriesByProfile ?? []).length;

  const recentSessions: Array<{ id: string; title: string; createdAt: string }> =
    ((sessionsData as any)?.chatSessionsByProfile ?? []).slice(0, 2);

  const firstCareerRoadmapId: string = roadmaps[0]?.careerRoadmapId ?? '';
  const { data: dashSkillGapData } = useQuery(GET_SKILL_GAP_ANALYSIS, {
    variables: { profileId, careerRoadmapId: firstCareerRoadmapId },
    skip: !profileId || !firstCareerRoadmapId,
  });
  const dashSkillGap = (dashSkillGapData as any)?.skillGapAnalysis ?? null;
  const skillGapData = dashSkillGap
    ? [
        ...((dashSkillGap.existingSkills ?? []) as string[]).slice(0, 3).map((s) => ({ skill: s, current: 100, required: 100 })),
        ...((dashSkillGap.missingSkills ?? []) as string[]).slice(0, 3).map((s) => ({ skill: s, current: 0, required: 100 })),
      ]
    : [];

  const isLoading = userLoading || roadmapsLoading;
  const hasError = userError || roadmapsError;

  return (
    <AppShell breadcrumb="Dashboard">
      <div className="app-page">
        <PageHeader
          title="Dashboard"
          description={isLoading ? 'Loading...' : `Good morning, ${fullName.split(' ')[0]}. Here's your career overview.`}
        />

        {hasError ? (
          <EmptyState
            icon={BarChart2}
            title="Failed to load dashboard"
            description="We couldn't load your data. Please try again."
            actionLabel="Retry"
            onAction={() => { refetchUser(); refetchRoadmaps(); }}
          />
        ) : (
          <>
            <div className="desktop-grid-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))
              ) : (
                <>
                  <StatCard
                    icon={<Compass className="w-5 h-5 text-[var(--md3-primary)]" />}
                    title="Active Roadmaps"
                    value={String(activeCount)}
                    subtitle="Active roadmaps"
                    trend={activeCount > 0 ? `${activeCount} total` : undefined}
                    trendUp
                    iconBg="var(--md3-primary-container)"
                  />
                  <StatCard
                    icon={<BarChart2 className="w-5 h-5 text-[var(--md3-success)]" />}
                    title="Avg Completion"
                    value={`${avgProgress}%`}
                    subtitle="Average completion"
                    showProgress
                    progress={avgProgress}
                    iconBg="var(--md3-success-container)"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-[var(--md3-warning)]" />}
                    title="Top Skill"
                    value={topSkillName}
                    subtitle="Top trending skill"
                    badge={topSkillName !== '—' ? 'Trending' : undefined}
                    iconBg="var(--md3-warning-container)"
                  />
                  <StatCard
                    icon={<Code className="w-5 h-5" style={{ color: '#7B1FA2' }} />}
                    title="GitHub Repos"
                    value={String(githubRepoCount)}
                    subtitle="Connected repositories"
                    iconBg="#F3E8FD"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="md3-card p-5 xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Trending Skills</h2>
                  <ActionLink icon={TrendingUp} label="View all" to="/market" variant="text" />
                </div>
                <div className="h-[200px]">
                  {trendChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-[var(--md3-on-surface-variant)]">No trending data available.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5F6368' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#5F6368' }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="md3-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Skill Gap</h2>
                  <ActionLink icon={BarChart2} label="Analyze" to="/skill-gap" variant="text" />
                </div>
                <div className="h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillGapData}>
                      <PolarGrid stroke="#E8EAED" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#5F6368' }} />
                      <Radar name="Current" dataKey="current" stroke="#1A73E8" fill="#1A73E8" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Required" dataKey="required" stroke="#FBBC04" fill="#FBBC04" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <ActionLink icon={ArrowRight} label="View full analysis" to="/skill-gap" className="mt-3 w-full" />
              </div>
            </div>

            <div className="desktop-grid-2">
              <div className="md3-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Recent AI Mentor Sessions</h2>
                  <ActionLink icon={Plus} label="New session" to="/mentor" />
                </div>
                <div className="space-y-2">
                  {recentSessions.length === 0 ? (
                    <p className="text-sm text-[var(--md3-on-surface-variant)] py-2">No sessions yet. Start a chat with your AI Mentor.</p>
                  ) : (
                    recentSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        title={session.title}
                        time={new Date(session.createdAt).toLocaleDateString()}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="md3-card p-5">
                <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction icon={<Rocket className="w-6 h-6 text-[var(--md3-primary)]" />} label="Generate Roadmap" to="/roadmaps" />
                  <QuickAction icon={<BarChart2 className="w-6 h-6 text-[var(--md3-primary)]" />} label="Skill Gap" to="/skill-gap" />
                  <QuickAction icon={<TrendingUp className="w-6 h-6 text-[var(--md3-primary)]" />} label="Market Pulse" to="/market" />
                  <QuickAction icon={<Code className="w-6 h-6 text-[var(--md3-primary)]" />} label="Add Repo" to="/portfolio" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendUp?: boolean;
  badge?: string;
  showProgress?: boolean;
  progress?: number;
  iconBg: string;
}

function StatCard({ icon, value, subtitle, trend, trendUp, badge, showProgress, progress, iconBg }: StatCardProps) {
  return (
    <div className="md3-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}>{icon}</div>
      </div>
      <div className="text-4xl font-bold text-[var(--md3-on-surface)] mb-1">{value}</div>
      <div className="text-sm text-[var(--md3-on-surface-variant)] mb-2">{subtitle}</div>
      {showProgress && progress !== undefined && (
        <div className="h-1.5 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--md3-success)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {trend && (
        <div className="flex items-center gap-1">
          <TrendingUp className={`w-4 h-4 ${trendUp ? 'text-[var(--md3-success)]' : 'text-[var(--md3-error)]'}`} />
          <span className={`text-xs font-medium ${trendUp ? 'text-[var(--md3-success)]' : 'text-[var(--md3-error)]'}`}>{trend}</span>
        </div>
      )}
      {badge && (
        <div className="inline-flex items-center px-2 py-1 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded text-xs font-medium">{badge}</div>
      )}
    </div>
  );
}

function SessionItem({ title, time }: { title: string; time: string }) {
  return (
    <Link to="/mentor" className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--md3-surface-variant)] transition-colors group">
      <Sparkles className="w-5 h-5 text-[var(--md3-on-surface-variant)] shrink-0 mt-0.5 group-hover:text-[var(--md3-primary)] transition-colors" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{title}</h3>
      </div>
      <span className="text-xs text-[var(--md3-on-surface-variant)] shrink-0">{time}</span>
    </Link>
  );
}

function QuickAction({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-2 p-4 bg-[var(--md3-surface-container)] rounded-lg hover:bg-[var(--md3-surface-variant)] transition-colors">
      {icon}
      <span className="text-sm font-medium text-[var(--md3-on-surface)] text-center">{label}</span>
    </Link>
  );
}
