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
import { Activity, BookOpen, Bot, Database, Users } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { apiClient } from '@/lib/axios';
import type { AdminOverviewDto } from '@/types/api';

const COLORS = ['#2563EB', '#0F766E', '#D97706', '#7C3AED'];

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useRestQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get<AdminOverviewDto>('/api/users/admin-overview').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <AppShell breadcrumb="Admin / Overview">
        <div className="app-page admin-page">
          <PageHeader title="Admin Overview" description="Monitor adoption, content health, and operational signals." />
          <div className="desktop-grid-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
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
          <EmptyState icon={Activity} title="Failed to load admin overview" description="Please refresh the dashboard." actionLabel="Retry" onAction={refetch} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Admin / Overview">
      <div className="app-page admin-page">
        <PageHeader
          title="Admin Overview"
          description="Monitor adoption, content health, and operational signals that guide the next phase of SECompass."
        />

        <div className="desktop-grid-4">
          <MetricCard icon={Users} label="Total users" value={data.totalUsers} detail={`${data.activeUsers} active accounts`} />
          <MetricCard icon={BookOpen} label="Roadmaps" value={data.personalRoadmaps} detail={`${data.averageRoadmapProgress}% avg progress`} />
          <MetricCard icon={Database} label="Content nodes" value={data.contentNodes} detail={`${data.roadmapTemplates} templates`} />
          <MetricCard icon={Bot} label="AI engagement" value={data.chatSessions} detail={`${data.gitHubRepositories} repositories linked`} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="admin-panel admin-section">
            <SectionTitle title="User Growth" subtitle="New registrations over the last six months." />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" fill="#DBEAFE" strokeWidth={2} name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionTitle title="Role Mix" subtitle="Account distribution by role." />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.roleBreakdown} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {data.roleBreakdown.map((entry, index) => <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {data.roleBreakdown.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--md3-on-surface-variant)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-[var(--md3-on-surface)]">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="admin-panel admin-section">
            <SectionTitle title="Content Inventory" subtitle="Core learning assets available to students." />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.contentInventory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md3-outline-variant)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0F766E" radius={[6, 6, 0, 0]} name="Items" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionTitle title="Market Signals" subtitle="Highest scoring job trends currently shaping recommendations." />
            <div className="space-y-3">
              {data.topJobTrends.slice(0, 6).map((trend) => (
                <div key={trend.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{trend.techSkill}</p>
                    <p className="text-xs text-[var(--md3-on-surface-variant)]">{trend.region ?? 'Global'} - {trend.source ?? 'Market data'}</p>
                  </div>
                  <span className="rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-sm font-semibold text-[var(--md3-primary)]">{trend.trendScore}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="admin-panel admin-section">
            <SectionTitle title="Operations" subtitle="Current automation and publishing state." />
            <div className="grid gap-3">
              <StatusRow label="Scraping schedule" value={data.scrapingEnabled ? 'Enabled' : 'Disabled'} tone={data.scrapingEnabled ? 'success' : 'warning'} />
              <StatusRow label="Active sources" value={String(data.activeScrapingSources)} />
              <StatusRow label="Public portfolios" value={String(data.publicPortfolios)} />
              <StatusRow label="Last scrape" value={data.lastScrapingRunAt ? new Date(data.lastScrapingRunAt).toLocaleString() : 'Never'} />
            </div>
          </section>

          <section className="admin-panel admin-section">
            <SectionTitle title="Recent Users" subtitle="Newest accounts joining the platform." />
            <div className="space-y-2">
              {data.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--md3-surface-container)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{user.fullName || user.email}</p>
                    <p className="truncate text-xs text-[var(--md3-on-surface-variant)]">{user.email}</p>
                  </div>
                  <span className="text-xs text-[var(--md3-on-surface-variant)]">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: number; detail: string }) {
  return (
    <div className="admin-panel p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-[var(--md3-on-surface-variant)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--md3-on-surface)]">{value.toLocaleString()}</p>
      <p className="mt-2 text-xs text-[var(--md3-on-surface-variant)]">{detail}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[var(--md3-on-surface)]">{title}</h2>
      <p className="text-sm text-[var(--md3-on-surface-variant)]">{subtitle}</p>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' }) {
  const toneClass = tone === 'success'
    ? 'bg-[var(--md3-success-container)] text-[var(--md3-success)]'
    : tone === 'warning'
      ? 'bg-[var(--md3-warning-container)] text-[var(--md3-warning)]'
      : 'bg-[var(--md3-surface-container)] text-[var(--md3-on-surface)]';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-3 py-3">
      <span className="text-sm text-[var(--md3-on-surface-variant)]">{label}</span>
      <span className={`rounded-md px-2 py-1 text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
