import { useQuery as useRestQuery } from '@tanstack/react-query';
import { ClipboardList, Download, Lightbulb, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { apiClient } from '@/lib/axios';
import type { AdminOverviewDto } from '@/types/api';

export function AdminReportsPage() {
  const { data, isLoading, error, refetch } = useRestQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get<AdminOverviewDto>('/api/users/admin-overview').then((r) => r.data),
  });

  const exportReport = () => {
    if (!data) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      summary: {
        users: data.totalUsers,
        activeUsers: data.activeUsers,
        personalRoadmaps: data.personalRoadmaps,
        averageRoadmapProgress: data.averageRoadmapProgress,
        repositories: data.gitHubRepositories,
        chatSessions: data.chatSessions,
      },
      roleBreakdown: data.roleBreakdown,
      contentInventory: data.contentInventory,
      topJobTrends: data.topJobTrends,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `secompass-admin-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <AppShell breadcrumb="Admin / Reports">
        <div className="app-page admin-page">
          <PageHeader title="Reports" description="Convert system signals into planning decisions." />
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

  const adoptionRate = data.totalUsers === 0 ? 0 : Math.round((data.activeUsers / data.totalUsers) * 100);
  const portfolioRate = data.totalUsers === 0 ? 0 : Math.round((data.publicPortfolios / data.totalUsers) * 100);
  const roadmapPerUser = data.totalUsers === 0 ? 0 : Math.round((data.personalRoadmaps / data.totalUsers) * 10) / 10;

  const recommendations = [
    {
      title: 'Increase roadmap activation',
      detail: `${roadmapPerUser} roadmap(s) per user with ${data.averageRoadmapProgress}% average progress. Promote guided onboarding for new students.`,
    },
    {
      title: 'Grow portfolio publishing',
      detail: `${portfolioRate}% of users have public portfolios. Add prompts after repository analysis to publish career-ready profiles.`,
    },
    {
      title: 'Prioritize market-aligned content',
      detail: `Top signal: ${data.topJobTrends[0]?.techSkill ?? 'No trend data yet'}. Use trends to decide the next node and resource updates.`,
    },
    {
      title: 'Keep automation healthy',
      detail: `${data.activeScrapingSources} active scraping source(s). Review failed or stale sources before planning recommendation updates.`,
    },
  ];

  return (
    <AppShell breadcrumb="Admin / Reports">
      <div className="app-page admin-page">
        <PageHeader
          title="Reports"
          description="Convert adoption, content, market, and operations signals into next-phase planning."
          actions={<AdminActionButton icon={Download} label="Export JSON" variant="tonal" onClick={exportReport} />}
        />

        <div className="desktop-grid-4">
          <ReportMetric label="Active rate" value={`${adoptionRate}%`} detail={`${data.activeUsers} of ${data.totalUsers} accounts`} />
          <ReportMetric label="Portfolio publish rate" value={`${portfolioRate}%`} detail={`${data.publicPortfolios} public portfolios`} />
          <ReportMetric label="Roadmaps per user" value={roadmapPerUser.toString()} detail={`${data.personalRoadmaps} generated roadmaps`} />
          <ReportMetric label="Automation sources" value={data.activeScrapingSources.toString()} detail={data.scrapingEnabled ? 'Scraping enabled' : 'Scraping disabled'} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <section className="admin-panel admin-section">
            <h2 className="mb-1 text-base font-semibold text-[var(--md3-on-surface)]">Growth Report</h2>
            <p className="mb-4 text-sm text-[var(--md3-on-surface-variant)]">Registration trend for demand planning and outreach.</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <h2 className="mb-1 text-base font-semibold text-[var(--md3-on-surface)]">Next-Phase Recommendations</h2>
            <p className="mb-4 text-sm text-[var(--md3-on-surface-variant)]">Operational suggestions based on current platform signals.</p>
            <div className="space-y-3">
              {recommendations.map((item) => (
                <div key={item.title} className="rounded-lg border border-[var(--md3-outline-variant)] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-[var(--md3-primary)]" />
                    <h3 className="text-sm font-semibold text-[var(--md3-on-surface)]">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-[var(--md3-on-surface-variant)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-panel admin-section">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--md3-primary)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--md3-on-surface)]">Market Report</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)]">Top trend scores to inform new templates, nodes, and learning resources.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.topJobTrends.slice(0, 8).map((trend) => (
              <div key={trend.id} className="rounded-lg border border-[var(--md3-outline-variant)] p-4">
                <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{trend.techSkill}</p>
                <p className="mt-1 text-xs text-[var(--md3-on-surface-variant)]">{trend.region ?? 'Global'} - {trend.source ?? 'Market data'}</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--md3-primary)]">{trend.trendScore}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ReportMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="admin-panel p-5">
      <p className="text-sm text-[var(--md3-on-surface-variant)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--md3-on-surface)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--md3-on-surface-variant)]">{detail}</p>
    </div>
  );
}
