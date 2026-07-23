import { useQuery as useRestQuery } from '@tanstack/react-query';
import {
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
import { ClipboardList, Download, Lightbulb } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { apiClient } from '@/lib/axios';
import type { AdminOverviewDto } from '@/types/api';
import {
  AdminKpiCard,
  SectionHeader,
  StatusBadgeRow,
  TrendListRow,
} from '../../components/admin/AdminDataWidgets';
import { CHART_COLORS } from '../../components/admin/adminChartColors';

export function AdminReportsPage() {
  const { data, isLoading, error, refetch } = useRestQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get<AdminOverviewDto>('/api/users/admin-overview').then((r) => r.data),
  });

  const exportReport = () => {
    if (!data) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      note: 'Admin accounts are excluded from all user metrics.',
      users: {
        total: data.totalUsers,
        active: data.activeUsers,
        inactive: data.inactiveUsers,
        mentors: data.mentorUsers,
        students: data.studentUsers,
        adoptionRate: data.totalUsers === 0 ? 0 : Math.round((data.activeUsers / data.totalUsers) * 100),
      },
      platform: {
        personalRoadmaps: data.personalRoadmaps,
        averageRoadmapProgress: data.averageRoadmapProgress,
        gitHubRepositories: data.gitHubRepositories,
        chatSessions: data.chatSessions,
        publicPortfolios: data.publicPortfolios,
      },
      content: {
        careerRoles: data.careerRoles,
        roadmapTemplates: data.roadmapTemplates,
        contentNodes: data.contentNodes,
        inventory: data.contentInventory,
      },
      growth: data.monthlyRegistrations,
      roleBreakdown: data.roleBreakdown,
      topJobTrends: data.topJobTrends,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secompass-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <AppShell breadcrumb="Admin / Reports">
        <div className="app-page admin-page">
          <PageHeader title="Reports" description="Convert platform signals into planning decisions." />
          <div className="desktop-grid-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell breadcrumb="Admin / Reports">
        <div className="app-page admin-page">
          <EmptyState icon={ClipboardList} title="Failed to load reports" description="Please try again." actionLabel="Retry" onAction={refetch} />
        </div>
      </AppShell>
    );
  }

  const adoptionRate   = data.totalUsers === 0 ? 0 : Math.round((data.activeUsers / data.totalUsers) * 100);
  const portfolioRate  = data.totalUsers === 0 ? 0 : Math.round((data.publicPortfolios / data.totalUsers) * 100);
  const roadmapPerUser = data.totalUsers === 0 ? 0 : Math.round((data.personalRoadmaps / data.totalUsers) * 10) / 10;
  const chatPerUser    = data.totalUsers === 0 ? 0 : Math.round((data.chatSessions / data.totalUsers) * 10) / 10;

  const recommendations: { title: string; detail: string }[] = [
    {
      title: 'Improve user activation',
      detail: `${adoptionRate}% of ${data.totalUsers} users are active. ${
        adoptionRate < 70
          ? 'Consider onboarding nudges and welcome e-mails to reduce early drop-off.'
          : 'Activation looks healthy — focus on deepening engagement with roadmaps and AI.'
      }`,
    },
    {
      title: 'Grow portfolio publishing',
      detail: `Only ${portfolioRate}% of users have public portfolios. Prompt users to publish after completing GitHub analysis — it increases visibility and retention.`,
    },
    {
      title: 'Deepen roadmap engagement',
      detail: `${roadmapPerUser} roadmap(s) per user, average progress ${data.averageRoadmapProgress}%. ${
        data.averageRoadmapProgress < 40
          ? 'Add progress milestones and push notification reminders for stalled learners.'
          : 'Progress is solid — consider advanced pathway branching for high-completion students.'
      }`,
    },
    {
      title: 'Prioritise market-aligned content',
      detail: `Top signal: "${data.topJobTrends[0]?.techSkill ?? 'N/A'}" (score ${data.topJobTrends[0]?.trendScore ?? '–'}). Align the next node releases and resource picks to the top 3 job-trend skills.`,
    },
    {
      title: 'Scale AI engagement',
      detail: `${chatPerUser} AI chat session(s) per user. ${
        chatPerUser < 2
          ? 'Surface the AI Mentor more prominently in the student dashboard to drive first interactions.'
          : 'Chat usage is healthy — analyse session topics to prioritise content gaps.'
      }`,
    },
    {
      title: 'Keep market data fresh',
      detail: `${data.activeScrapingSources} active scraping source(s). Scraping is ${data.scrapingEnabled ? 'enabled' : 'disabled'}. Last run: ${
        data.lastScrapingRunAt ? new Date(data.lastScrapingRunAt).toLocaleString() : 'never'
      }. Review sources regularly to avoid stale trend data driving bad recommendations.`,
    },
  ];

  return (
    <AppShell breadcrumb="Admin / Reports">
      <div className="app-page admin-page">
        <PageHeader
          title="Reports"
          description="Adoption, engagement, content coverage, and market signals — admin accounts excluded."
          actions={<AdminActionButton icon={Download} label="Export JSON" variant="tonal" onClick={exportReport} />}
        />

        {/* KPI row */}
        <div className="desktop-grid-4">
          <AdminKpiCard label="Adoption rate" value={`${adoptionRate}%`} detail={`${data.activeUsers} active of ${data.totalUsers} users`} />
          <AdminKpiCard label="Portfolio publish rate" value={`${portfolioRate}%`} detail={`${data.publicPortfolios} public portfolio${data.publicPortfolios !== 1 ? 's' : ''}`} />
          <AdminKpiCard label="Roadmaps per user" value={roadmapPerUser} detail={`${data.averageRoadmapProgress}% avg completion`} />
          <AdminKpiCard label="AI sessions per user" value={chatPerUser} detail={`${data.chatSessions} total sessions`} />
        </div>

        {/* User segment + engagement breakdown */}
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="admin-panel admin-section">
            <SectionHeader title="User Segments" subtitle="Breakdown of Mentor and Student accounts." />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Mentors', value: data.mentorUsers, pct: data.totalUsers > 0 ? Math.round((data.mentorUsers / data.totalUsers) * 100) : 0 },
                { label: 'Students', value: data.studentUsers, pct: data.totalUsers > 0 ? Math.round((data.studentUsers / data.totalUsers) * 100) : 0 },
                { label: 'Active users', value: data.activeUsers, pct: adoptionRate },
                { label: 'Inactive users', value: data.inactiveUsers, pct: data.totalUsers > 0 ? Math.round((data.inactiveUsers / data.totalUsers) * 100) : 0 },
              ].map(({ label, value, pct }) => (
                <div key={label} className="rounded-lg border border-[var(--md3-outline-variant)] p-4">
                  <p className="text-xs text-[var(--md3-on-surface-variant)]">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--md3-on-surface)]">{value.toLocaleString()}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--md3-surface-container)]">
                    <div className="h-full rounded-full bg-[var(--md3-primary)]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--md3-on-surface-variant)]">{pct}% of users</p>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionHeader title="Platform Engagement" subtitle="Usage depth across key features." />
            <div className="grid gap-3">
              <StatusBadgeRow label="Personal roadmaps" value={`${data.personalRoadmaps} total`} />
              <StatusBadgeRow label="Avg roadmap progress" value={`${data.averageRoadmapProgress}%`} tone={data.averageRoadmapProgress >= 50 ? 'success' : data.averageRoadmapProgress >= 25 ? 'warning' : 'error'} />
              <StatusBadgeRow label="GitHub repositories" value={`${data.gitHubRepositories} linked`} />
              <StatusBadgeRow label="AI chat sessions" value={`${data.chatSessions} total`} />
              <StatusBadgeRow label="Public portfolios" value={`${data.publicPortfolios} published`} tone={portfolioRate >= 30 ? 'success' : 'warning'} />
            </div>
          </section>
        </div>

        {/* Growth chart + Role distribution */}
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="admin-panel admin-section">
            <SectionHeader title="Registration Growth" subtitle="New Mentor and Student sign-ups over the last six months." />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionHeader title="Role Balance" subtitle="Mentor-to-Student ratio." />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.roleBreakdown} dataKey="value" nameKey="label" innerRadius={52} outerRadius={84} paddingAngle={3}>
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

        {/* Market report + Content coverage */}
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="admin-panel admin-section">
            <SectionHeader title="Market Report" subtitle="Top 8 tech skills by demand score — use to guide next content priorities." />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...data.topJobTrends].sort((a, b) => b.trendScore - a.trendScore).slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="techSkill" width={72} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="trendScore" fill="#7C3AED" radius={[0, 6, 6, 0]} name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionHeader title="Content Coverage" subtitle="Learning assets available to platform users." />
            <div className="grid gap-3">
              {data.contentInventory.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-4 py-3">
                  <span className="text-sm text-[var(--md3-on-surface-variant)]">{item.label}</span>
                  <span className="text-lg font-semibold text-[var(--md3-on-surface)]">{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-4 py-3">
                <span className="text-sm text-[var(--md3-on-surface-variant)]">Job trends tracked</span>
                <span className="text-lg font-semibold text-[var(--md3-on-surface)]">{data.topJobTrends.length}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Top signals</p>
              {data.topJobTrends.slice(0, 3).map((trend) => (
                <TrendListRow key={trend.id} trend={trend} />
              ))}
            </div>
          </section>
        </div>

        {/* Recommendations */}
        <section className="admin-panel admin-section">
          <SectionHeader title="Next-Phase Recommendations" subtitle="Action items generated from current platform signals." />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((item) => (
              <div key={item.title} className="rounded-lg border border-[var(--md3-outline-variant)] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-[var(--md3-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--md3-on-surface)]">{item.title}</h3>
                </div>
                <p className="text-sm leading-6 text-[var(--md3-on-surface-variant)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
