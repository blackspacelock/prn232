import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Search, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { GET_JOB_TRENDS_BY_REGION, GET_TOP_TRENDING_SKILLS } from '@/graphql/queries';

interface JobTrend {
  id: string;
  techSkill: string;
  description?: string;
  source?: string;
  region?: string;
  trendScore: number;
  snapshotDate: string;
}

const REGIONS = ['Vietnam', 'Singapore', 'Thailand', 'Global'];

export function MarketPulsePage() {
  const [region, setRegion] = useState('Vietnam');

  const { data: trendsData, loading: trendsLoading, error: trendsError, refetch } = useQuery(GET_JOB_TRENDS_BY_REGION, {
    variables: { region },
  });

  const [loadTrends] = useLazyQuery(GET_JOB_TRENDS_BY_REGION);

  const { data: topSkillsData, loading: topSkillsLoading } = useQuery(GET_TOP_TRENDING_SKILLS, {
    variables: { count: 10 },
  });

  const trends: JobTrend[] = (trendsData as any)?.jobTrendsByRegion ?? [];
  const topSkills: JobTrend[] = (topSkillsData as any)?.topTrendingSkills ?? [];

  const chartData = topSkills.map((s) => ({ name: s.techSkill, score: s.trendScore }));

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    loadTrends({ variables: { region: newRegion } });
  };

  return (
    <AppShell breadcrumb="Market Pulse">
      <div className="app-page">
        <PageHeader title="Market Pulse" description="Real-time demand data for software engineering skills." />

        <div className="md3-panel flex flex-wrap items-center gap-3 p-4">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => handleRegionChange(r)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                region === r
                  ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-primary)]'
                  : 'border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] hover:border-[var(--md3-on-surface-variant)]'
              }`}
            >
              {r}
            </button>
          ))}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            <input type="text" placeholder="Filter by skill..." className="md3-field w-full pl-12 pr-4" />
          </div>
        </div>

        {trendsLoading || topSkillsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-72 rounded-xl" />
            <div className="desktop-grid-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          </div>
        ) : trendsError ? (
          <EmptyState icon={TrendingUp} title="Failed to load trends" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <>
            <div className="md3-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">Top Trending Skills</h2>
                <span className="text-sm text-[var(--md3-on-surface-variant)]">{region}</span>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-[var(--md3-on-surface-variant)] text-center py-8">No data available for this region.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5F6368' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#5F6368' }} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {trends.length > 0 && (
              <div className="desktop-grid-3">
                {trends.slice(0, 9).map((trend) => (
                  <SkillCard key={trend.id} trend={trend} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-lg border border-[var(--md3-outline-variant)]">
        <p className="text-sm font-medium text-[var(--md3-on-surface)] mb-1">{label}</p>
        <p className="text-xs text-[var(--md3-on-surface-variant)]">Score: {payload[0]?.value}</p>
      </div>
    );
  }
  return null;
}

function SkillCard({ trend }: { trend: JobTrend }) {
  return (
    <div className="md3-card p-5">
      <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-2">{trend.techSkill}</h3>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-[var(--md3-on-surface)]">{trend.trendScore}</span>
        <span className="text-lg text-[var(--md3-on-surface-variant)]">/100</span>
      </div>
      <div className="h-1.5 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden mb-3">
        <div className="h-full bg-[var(--md3-primary)] rounded-full" style={{ width: `${trend.trendScore}%` }} />
      </div>
      {trend.source && (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">{trend.source}</span>
      )}
    </div>
  );
}
