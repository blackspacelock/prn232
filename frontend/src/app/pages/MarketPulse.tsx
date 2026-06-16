import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { AdminListToolbar, AdminPagination, AdminFilterSelect, useAdminList, type AdminSortOption } from '../components/admin/AdminListControls';
import { Search, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { GET_JOB_TRENDS_BY_REGION, GET_TOP_TRENDING_SKILLS } from '@/graphql/queries';
import { getSkillColor, hashLabel, SkillChip } from '../components/SkillChip';

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

const AREA_SERIES_COLORS = [
  { stroke: '#1A73E8', fill: '#E8F0FE' },
  { stroke: '#34A853', fill: '#E6F4EA' },
  { stroke: '#7B1FA2', fill: '#F3E8FD' },
];

type TrendSort = 'score' | 'name' | 'date';

const SORT_OPTIONS: AdminSortOption<TrendSort>[] = [
  { value: 'score', label: 'Trend Score' },
  { value: 'name', label: 'Skill Name' },
  { value: 'date', label: 'Snapshot Date' },
];

const SOURCE_ALL = '';

interface TrendHistoryPoint {
  date: string;
  [skill: string]: string | number;
}

function buildTrendHistory(trends: JobTrend[]): { skills: string[]; data: TrendHistoryPoint[] } {
  if (trends.length === 0) return { skills: [], data: [] };

  const latestDate = trends.reduce((max, t) => (t.snapshotDate > max ? t.snapshotDate : max), trends[0].snapshotDate);

  const latestScores = new Map<string, number>();
  for (const t of trends) {
    if (t.snapshotDate !== latestDate) continue;
    latestScores.set(t.techSkill, Math.max(latestScores.get(t.techSkill) ?? 0, t.trendScore));
  }

  const topSkills = [...latestScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill]) => skill);

  const dateMap = new Map<string, TrendHistoryPoint>();
  for (const t of trends) {
    if (!topSkills.includes(t.techSkill)) continue;
    const dateKey = t.snapshotDate.split('T')[0];
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, { date: dateKey });
    dateMap.get(dateKey)![t.techSkill] = t.trendScore;
  }

  const data = [...dateMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { skills: topSkills, data };
}

export function MarketPulsePage() {
  const [region, setRegion] = useState('Vietnam');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<TrendSort>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sourceFilter, setSourceFilter] = useState(SOURCE_ALL);

  const { data: trendsData, loading: trendsLoading, error: trendsError, refetch } = useQuery(GET_JOB_TRENDS_BY_REGION, {
    variables: { region },
  });

  const [loadTrends] = useLazyQuery(GET_JOB_TRENDS_BY_REGION);

  const { data: topSkillsData, loading: topSkillsLoading } = useQuery(GET_TOP_TRENDING_SKILLS, {
    variables: { count: 10 },
  });

  const allTrends: JobTrend[] = (trendsData as { jobTrendsByRegion?: JobTrend[] })?.jobTrendsByRegion ?? [];
  const topSkills: JobTrend[] = (topSkillsData as { topTrendingSkills?: JobTrend[] })?.topTrendingSkills ?? [];

  const sources = [...new Set(allTrends.map((t) => t.source).filter(Boolean))] as string[];
  const sourceOptions = [
    { value: SOURCE_ALL, label: 'All Sources' },
    ...sources.map((s) => ({ value: s, label: s })),
  ];

  const sourceFiltered = sourceFilter
    ? allTrends.filter((t) => t.source === sourceFilter)
    : allTrends;

  const trendList = useAdminList<JobTrend, TrendSort>({
    items: sourceFiltered,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (t, term) => t.techSkill.toLowerCase().includes(term),
    getSortValue: (t, key) => {
      if (key === 'score') return t.trendScore;
      if (key === 'name') return t.techSkill;
      return t.snapshotDate;
    },
  });

  const chartData = (search
    ? topSkills.filter((s) => s.techSkill.toLowerCase().includes(search.toLowerCase()))
    : topSkills
  ).map((s) => ({ name: s.techSkill, score: s.trendScore, color: getSkillColor(hashLabel(s.techSkill)).accent }));

  const trendHistory = buildTrendHistory(allTrends);

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
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="md3-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">Trend Over Time</h2>
                <span className="text-sm text-[var(--md3-on-surface-variant)]">{region}</span>
              </div>
              {trendHistory.data.length >= 2 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendHistory.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5F6368' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#5F6368' }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {trendHistory.skills.map((skill, i) => (
                        <Area
                          key={skill}
                          type="monotone"
                          dataKey={skill}
                          stroke={AREA_SERIES_COLORS[i].stroke}
                          fill={AREA_SERIES_COLORS[i].fill}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-[var(--md3-on-surface-variant)] text-center py-8">
                  Trend history builds up after weekly scrapes run.
                </p>
              )}
            </div>

            <div>
              <AdminListToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search skills..."
                sortKey={sortKey}
                onSortKeyChange={setSortKey}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                sortOptions={SORT_OPTIONS}
              >
                {sources.length > 0 && (
                  <AdminFilterSelect
                    value={sourceFilter}
                    onChange={setSourceFilter}
                    options={sourceOptions}
                    ariaLabel="Filter by source"
                    label="Source"
                  />
                )}
              </AdminListToolbar>

              {trendList.pagedItems.length > 0 ? (
                <>
                  <div className="desktop-grid-3 mt-4">
                    {trendList.pagedItems.map((trend) => (
                      <SkillCard key={trend.id} trend={trend} />
                    ))}
                  </div>
                  <AdminPagination {...trendList} onPageChange={trendList.setPage} />
                </>
              ) : (
                <div className="mt-4 flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="w-10 h-10 text-[var(--md3-on-surface-variant)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--md3-on-surface-variant)]">No skills match your search.</p>
                  </div>
                </div>
              )}
            </div>
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
  const color = getSkillColor(hashLabel(trend.techSkill));

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${color.bg} ${color.border}`}>
      <div className="mb-3">
        <SkillChip label={trend.techSkill} size="sm" />
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-3xl font-bold ${color.text}`}>{trend.trendScore}</span>
        <span className="text-lg text-[var(--md3-on-surface-variant)]">/100</span>
      </div>
      <div className="h-1.5 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full" style={{ width: `${trend.trendScore}%`, backgroundColor: color.accent }} />
      </div>
      {trend.source && (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border bg-white/70 ${color.text} ${color.border}`}>{trend.source}</span>
      )}
    </div>
  );
}
