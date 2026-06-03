import { Link } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { ActionLink } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Compass, TrendingUp, Code, BarChart2, Rocket, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import { useQuery } from '@apollo/client/react';
import { useAuthStore } from '@/store/authStore';
import { GET_USER_BY_ID, GET_PERSONAL_ROADMAPS_BY_PROFILE } from '@/graphql/queries';

const trendData = [
  { month: 'Jan', React: 85, Python: 78, Kubernetes: 65 },
  { month: 'Feb', React: 88, Python: 80, Kubernetes: 68 },
  { month: 'Mar', React: 90, Python: 82, Kubernetes: 70 },
  { month: 'Apr', React: 92, Python: 85, Kubernetes: 73 },
  { month: 'May', React: 95, Python: 87, Kubernetes: 75 },
  { month: 'Jun', React: 98, Python: 90, Kubernetes: 78 },
];

const skillGapData = [
  { skill: 'Frontend', current: 85, required: 90 },
  { skill: 'Backend', current: 60, required: 85 },
  { skill: 'DevOps', current: 40, required: 70 },
  { skill: 'Database', current: 70, required: 80 },
  { skill: 'Testing', current: 55, required: 75 },
];

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

  const fullName = (userData as any)?.userById?.fullName ?? user?.email ?? 'there';
  const roadmaps = (roadmapsData as any)?.personalRoadmapsByProfile ?? [];
  const activeCount = roadmaps.length;
  const avgProgress = activeCount > 0
    ? Math.round(roadmaps.reduce((sum: number, r: { progressPercentage: number }) => sum + r.progressPercentage, 0) / activeCount)
    : 0;

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
                    value="React"
                    subtitle="Your strongest skill"
                    badge="Trending"
                    iconBg="var(--md3-warning-container)"
                  />
                  <StatCard
                    icon={<Code className="w-5 h-5" style={{ color: '#7B1FA2' }} />}
                    title="GitHub Repos"
                    value="—"
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorReact" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPython" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E8E3E" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1E8E3E" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorKubernetes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B1FA2" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#7B1FA2" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5F6368' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#5F6368' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="React" stroke="#1A73E8" fill="url(#colorReact)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Python" stroke="#1E8E3E" fill="url(#colorPython)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Kubernetes" stroke="#7B1FA2" fill="url(#colorKubernetes)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
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
                  <SessionItem
                    title="Career path for backend dev"
                    preview="How do I transition to backend development with my..."
                    time="2 hours ago"
                  />
                  <SessionItem
                    title="Learning roadmap advice"
                    preview="What's the best order to learn these technologies..."
                    time="Yesterday"
                  />
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

function SessionItem({ title, preview, time }: { title: string; preview: string; time: string }) {
  return (
    <Link to="/mentor" className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--md3-surface-variant)] transition-colors group">
      <Sparkles className="w-5 h-5 text-[var(--md3-on-surface-variant)] shrink-0 mt-0.5 group-hover:text-[var(--md3-primary)] transition-colors" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-0.5 truncate">{title}</h3>
        <p className="text-xs text-[var(--md3-on-surface-variant)] truncate">{preview}</p>
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
