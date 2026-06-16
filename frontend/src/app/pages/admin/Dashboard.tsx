import { useQuery as useRestQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Bot, BookOpen, Database, GitBranch, Globe, Users, UserCheck } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { apiClient } from '@/lib/axios';
import type { AdminOverviewDto } from '@/types/api';
import {
  AdminStatCard,
  CHART_COLORS,
  SectionHeader,
  StatusBadgeRow,
  TrendListRow,
  UserListRow,
} from '../../components/admin/AdminDataWidgets';

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useRestQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get<AdminOverviewDto>('/api/users/admin-overview').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <AppShell breadcrumb="Admin / Overview">
        <div className="app-page admin-page">
          <PageHeader title="Overview" description="Monitor adoption, content health, and operational signals." />
          <div className="desktop-grid-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
          <div className="desktop-grid-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell breadcrumb="Admin / Overview">
        <div className="app-page admin-page">
          <EmptyState icon={Activity} title="Failed to load overview" description="Please refresh the page." actionLabel="Retry" onAction={refetch} />
        </div>
      </AppShell>
    );
  }

  const activeRate = data.totalUsers === 0 ? 0 : Math.round((data.activeUsers / data.totalUsers) * 100);

  return (
    <AppShell breadcrumb="Admin / Overview">
      <div className="app-page admin-page">
        <PageHeader
          title="Overview"
          description="Monitor user adoption, content health, and operational signals."
        />

        {/* Primary user metrics */}
        <div className="desktop-grid-4">
          <AdminStatCard icon={Users} label="Total users" value={data.totalUsers} detail={`${data.activeUsers} active · ${data.inactiveUsers} inactive`} />
          <AdminStatCard icon={UserCheck} label="Active rate" value={`${activeRate}%`} detail={`${data.activeUsers} of ${data.totalUsers} accounts`} />
          <AdminStatCard icon={Users} label="Mentors" value={data.mentorUsers} detail={`${data.totalUsers > 0 ? Math.round((data.mentorUsers / data.totalUsers) * 100) : 0}% of user base`} />
          <AdminStatCard icon={Users} label="Students" value={data.studentUsers} detail={`${data.totalUsers > 0 ? Math.round((data.studentUsers / data.totalUsers) * 100) : 0}% of user base`} />
        </div>

        {/* Platform engagement metrics */}
        <div className="desktop-grid-4">
          <AdminStatCard icon={BookOpen} label="Personal roadmaps" value={data.personalRoadmaps} detail={`${data.averageRoadmapProgress}% avg progress`} />
          <AdminStatCard icon={Bot} label="AI chat sessions" value={data.chatSessions} detail={data.totalUsers > 0 ? `${(data.chatSessions / data.totalUsers).toFixed(1)} per user` : 'No users yet'} />
          <AdminStatCard icon={GitBranch} label="GitHub repositories" value={data.gitHubRepositories} detail={data.totalUsers > 0 ? `${(data.gitHubRepositories / data.totalUsers).toFixed(1)} per user` : 'No users yet'} />
          <AdminStatCard icon={Globe} label="Public portfolios" value={data.publicPortfolios} detail={data.totalUsers > 0 ? `${Math.round((data.publicPortfolios / data.totalUsers) * 100)}% published` : 'No users yet'} />
        </div>

        {/* User growth + Role mix */}
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="admin-panel admin-section">
            <SectionHeader title="User Growth" subtitle="New normal-user registrations over the last six months." />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" fill="#DBEAFE" strokeWidth={2} name="New users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionHeader title="Role Distribution" subtitle="Mentor vs Student breakdown." />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.roleBreakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {data.roleBreakdown.map((entry, i) => (
                      <Cell key={entry.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid gap-2">
              {data.roleBreakdown.map((item, i) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--md3-on-surface-variant)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-[var(--md3-on-surface)]">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Content inventory + Market signals */}
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="admin-panel admin-section">
            <SectionHeader title="Content Inventory" subtitle="Core learning assets available on the platform." />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.contentInventory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0F766E" radius={[6, 6, 0, 0]} name="Items" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionHeader title="Market Signals" subtitle="Highest-scoring job trends shaping recommendations." />
            <div className="space-y-2">
              {data.topJobTrends.slice(0, 6).map((trend) => (
                <TrendListRow key={trend.id} trend={trend} />
              ))}
            </div>
          </section>
        </div>

        {/* Operations + Recent users */}
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="admin-panel admin-section">
            <SectionHeader title="Operations" subtitle="Automation and publishing status." />
            <div className="grid gap-3">
              <StatusBadgeRow label="Scraping schedule" value={data.scrapingEnabled ? 'Enabled' : 'Disabled'} tone={data.scrapingEnabled ? 'success' : 'warning'} />
              <StatusBadgeRow label="Active sources" value={String(data.activeScrapingSources)} />
              <StatusBadgeRow label="Public portfolios" value={String(data.publicPortfolios)} />
              <StatusBadgeRow label="Career roles" value={String(data.careerRoles)} />
              <StatusBadgeRow label="Roadmap templates" value={String(data.roadmapTemplates)} />
              <StatusBadgeRow label="Content nodes" value={String(data.contentNodes)} />
              <StatusBadgeRow label="Last scrape" value={data.lastScrapingRunAt ? new Date(data.lastScrapingRunAt).toLocaleString() : 'Never'} />
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionHeader title="Recent Users" subtitle="Newest Mentor and Student accounts." />
            <div className="space-y-2">
              {data.recentUsers.length === 0 ? (
                <p className="text-sm text-[var(--md3-on-surface-variant)]">No users yet.</p>
              ) : (
                data.recentUsers.map((user) => <UserListRow key={user.id} user={user} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
