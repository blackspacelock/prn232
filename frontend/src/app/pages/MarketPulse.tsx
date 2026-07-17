import { useEffect, useMemo, useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { AdminPagination, AdminFilterSelect } from '../components/admin/AdminListControls';
import { useAdminList, type AdminSortOption } from '../components/admin/useAdminList';
import { Activity, CalendarRange, ChevronDown, Database, Search, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { useQuery } from '@apollo/client/react';
import { GET_JOB_TRENDS_BY_REGION } from '@/graphql/queries';
import { SkillChip } from '../components/SkillChip';
import { getSkillColor, hashLabel } from '../components/skillColorUtils';

interface JobTrend {
  id: string;
  techSkill: string;
  description?: string;
  source?: string;
  region?: string;
  trendScore: number;
  snapshotDate: string;
}

interface SkillSignal {
  name: string;
  rawScore: number;
  relativeIndex: number;
  records: number;
  sources: number;
  latestScore: number;
  previousScore?: number;
  delta: number;
  color: string;
}

interface TrendHistoryPoint {
  date: string;
  [skill: string]: string | number;
}

interface SourceMixPoint {
  name: string;
  value: number;
  color: string;
}

type TrendSort = 'score' | 'name' | 'date';

const REGIONS = ['Vietnam', 'Global'];
const SOURCE_ALL = '';

const SORT_OPTIONS: AdminSortOption<TrendSort>[] = [
  { value: 'score', label: 'Trend Score' },
  { value: 'name', label: 'Skill Name' },
  { value: 'date', label: 'Snapshot Date' },
];

const LINE_SERIES_COLORS = [
  '#1A73E8',
  '#34A853',
  '#7B1FA2',
  '#F29900',
  '#D93025',
  '#00897B',
  '#5F6368',
  '#C2185B',
];

function toDateKey(value: string): string {
  return value.split('T')[0];
}

function formatDate(value?: string): string {
  if (!value) return 'No snapshots';
  return new Date(value).toLocaleDateString();
}

function filterByDateRange(trends: JobTrend[], startDate: string, endDate: string): JobTrend[] {
  return trends.filter((trend) => {
    const dateKey = toDateKey(trend.snapshotDate);
    return (!startDate || dateKey >= startDate) && (!endDate || dateKey <= endDate);
  });
}

function getSnapshotDateRange(trends: JobTrend[]): { from: string; to: string } {
  const dates = trends.map((trend) => toDateKey(trend.snapshotDate)).sort();
  return {
    from: dates[0] ?? '',
    to: dates.at(-1) ?? '',
  };
}

function buildSkillSignals(trends: JobTrend[], limit?: number): SkillSignal[] {
  const grouped = new Map<string, JobTrend[]>();

  for (const trend of trends) {
    const key = trend.techSkill.trim();
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), trend]);
  }

  const rawSignals = [...grouped.entries()].map(([name, entries]) => {
    const sorted = [...entries].sort((a, b) => toDateKey(a.snapshotDate).localeCompare(toDateKey(b.snapshotDate)));
    const rawScore = Math.round(entries.reduce((sum, item) => sum + item.trendScore, 0) / entries.length);
    const latestDate = toDateKey(sorted[sorted.length - 1].snapshotDate);
    const latestEntries = sorted.filter((item) => toDateKey(item.snapshotDate) === latestDate);
    const latestScore = Math.round(latestEntries.reduce((sum, item) => sum + item.trendScore, 0) / latestEntries.length);
    const previousDate = [...new Set(sorted.map((item) => toDateKey(item.snapshotDate)))].slice(-2, -1)[0];
    const previousEntries = previousDate ? sorted.filter((item) => toDateKey(item.snapshotDate) === previousDate) : [];
    const previousScore = previousEntries.length > 0
      ? Math.round(previousEntries.reduce((sum, item) => sum + item.trendScore, 0) / previousEntries.length)
      : undefined;

    return {
      name,
      rawScore,
      relativeIndex: 0,
      records: entries.length,
      sources: new Set(entries.map((item) => item.source?.trim() || 'Unspecified')).size,
      latestScore,
      previousScore,
      delta: previousScore === undefined ? 0 : latestScore - previousScore,
      color: getSkillColor(hashLabel(name)).accent,
    };
  }).sort((a, b) => b.rawScore - a.rawScore || a.name.localeCompare(b.name));

  const maxScore = Math.max(...rawSignals.map((signal) => signal.rawScore), 0);
  const signals = rawSignals.map((signal) => ({
    ...signal,
    relativeIndex: maxScore > 0 ? Math.round((signal.rawScore / maxScore) * 100) : 0,
  }));

  return typeof limit === 'number' ? signals.slice(0, limit) : signals;
}

function buildTrendHistory(trends: JobTrend[], skills: string[]): { data: TrendHistoryPoint[]; rawData: TrendHistoryPoint[] } {
  if (trends.length === 0 || skills.length === 0) return { data: [], rawData: [] };

  const dateSkillScores = new Map<string, Map<string, { total: number; count: number }>>();

  for (const trend of trends) {
    if (!skills.includes(trend.techSkill)) continue;
    const dateKey = toDateKey(trend.snapshotDate);
    if (!dateSkillScores.has(dateKey)) dateSkillScores.set(dateKey, new Map());
    const skillMap = dateSkillScores.get(dateKey)!;
    const current = skillMap.get(trend.techSkill) ?? { total: 0, count: 0 };
    current.total += trend.trendScore;
    current.count += 1;
    skillMap.set(trend.techSkill, current);
  }

  const rawData = [...dateSkillScores.entries()]
    .map(([date, skillMap]) => {
      const point: TrendHistoryPoint = { date };
      for (const skill of skills) {
        const score = skillMap.get(skill);
        if (score) point[skill] = Math.round(score.total / score.count);
      }
      return point;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const maxScore = Math.max(
    ...rawData.flatMap((point) =>
      skills.map((skill) => (typeof point[skill] === 'number' ? point[skill] as number : 0)),
    ),
    0,
  );

  const data = rawData.map((point) => {
    const relativePoint: TrendHistoryPoint = { date: point.date };
    for (const skill of skills) {
      const score = point[skill];
      if (typeof score === 'number') {
        relativePoint[skill] = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      }
    }
    return relativePoint;
  });

  return { data, rawData };
}

function buildSourceMix(trends: JobTrend[]): SourceMixPoint[] {
  const grouped = new Map<string, number>();

  for (const trend of trends) {
    const source = trend.source?.trim() || 'Unspecified';
    grouped.set(source, (grouped.get(source) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: getSkillColor(hashLabel(name)).accent,
    }));
}

export function MarketPulsePage() {
  const [region, setRegion] = useState('Global');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<TrendSort>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sourceFilter, setSourceFilter] = useState(SOURCE_ALL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRawRecordsOpen, setIsRawRecordsOpen] = useState(false);

  const { data: trendsData, loading, error, refetch } = useQuery(GET_JOB_TRENDS_BY_REGION, {
    variables: { region },
  });

  const allTrends: JobTrend[] = (trendsData as { jobTrendsByRegion?: JobTrend[] })?.jobTrendsByRegion ?? [];
  const snapshotDateRange = useMemo(() => getSnapshotDateRange(allTrends), [allTrends]);

  useEffect(() => {
    setStartDate(snapshotDateRange.from);
    setEndDate(snapshotDateRange.to);
  }, [snapshotDateRange.from, snapshotDateRange.to]);

  const dateFilteredTrends = useMemo(
    () => filterByDateRange(allTrends, startDate, endDate),
    [allTrends, startDate, endDate],
  );

  const sources = [...new Set(dateFilteredTrends.map((trend) => trend.source).filter(Boolean))] as string[];
  const sourceOptions = [
    { value: SOURCE_ALL, label: 'All Sources' },
    ...sources.map((source) => ({ value: source, label: source })),
  ];

  const sourceFilteredTrends = sourceFilter
    ? dateFilteredTrends.filter((trend) => trend.source === sourceFilter)
    : dateFilteredTrends;

  const scopedTrends = search
    ? sourceFilteredTrends.filter((trend) => trend.techSkill.toLowerCase().includes(search.toLowerCase()))
    : sourceFilteredTrends;

  const signals = buildSkillSignals(scopedTrends);
  const topSignals = signals.slice(0, 10);
  const timelineSkills = topSignals.slice(0, 6).map((signal) => signal.name);
  const trendHistory = buildTrendHistory(scopedTrends, timelineSkills);
  const sourceMixData = buildSourceMix(dateFilteredTrends);
  const topSignal = topSignals[0];
  const latestSnapshot = allTrends.map((trend) => trend.snapshotDate).sort().at(-1);
  const rawAverage = scopedTrends.length > 0
    ? Math.round(scopedTrends.reduce((sum, trend) => sum + trend.trendScore, 0) / scopedTrends.length)
    : 0;

  const trendList = useAdminList<JobTrend, TrendSort>({
    items: scopedTrends,
    searchText: '',
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: () => true,
    getSortValue: (trend, key) => {
      if (key === 'score') return trend.trendScore;
      if (key === 'name') return trend.techSkill;
      return trend.snapshotDate;
    },
  });

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setSourceFilter(SOURCE_ALL);
  };

  return (
    <AppShell breadcrumb="Market Pulse">
      <div className="app-page">
        <PageHeader
          title="Market Pulse"
          description="Demand signals for software skills, normalized for comparison and backed by raw job-trend records."
        />

        <section className="md3-panel p-4">
          <div className="grid gap-3 lg:grid-cols-[auto_minmax(220px,1fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_minmax(180px,0.8fr)] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Market</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleRegionChange(item)}
                    className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
                      region === item
                        ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
                        : 'border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <label className="text-sm font-medium text-[var(--md3-on-surface)]">
              Search skill
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="React, SQL, Azure..."
                  className="md3-field h-10 w-full px-9"
                />
              </div>
            </label>

            <label className="text-sm font-medium text-[var(--md3-on-surface)]">
              From
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="md3-field mt-1 h-10 w-full px-3"
              />
            </label>

            <label className="text-sm font-medium text-[var(--md3-on-surface)]">
              To
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="md3-field mt-1 h-10 w-full px-3"
              />
            </label>

            {sources.length > 0 && (
              <AdminFilterSelect
                value={sourceFilter}
                onChange={setSourceFilter}
                options={sourceOptions}
                ariaLabel="Filter by source"
                label="Source"
              />
            )}
          </div>
        </section>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-[360px] rounded-xl" />
            <div className="desktop-grid-2">
              <Skeleton className="h-[280px] rounded-xl" />
              <Skeleton className="h-[280px] rounded-xl" />
            </div>
          </div>
        ) : error ? (
          <EmptyState icon={TrendingUp} title="Failed to load trends" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile icon={TrendingUp} label="Leading signal" value={topSignal?.name ?? 'No data'} detail={topSignal ? `Index ${topSignal.relativeIndex} · raw ${topSignal.rawScore}/100` : 'Try another filter'} />
              <MetricTile icon={Database} label="Trend records" value={String(scopedTrends.length)} detail={`${signals.length} unique skill${signals.length !== 1 ? 's' : ''}`} />
              <MetricTile icon={Activity} label="Average raw score" value={`${rawAverage}/100`} detail="Raw scrape score before normalization" />
              <MetricTile icon={CalendarRange} label="Latest snapshot" value={formatDate(latestSnapshot)} detail={region === 'Global' ? 'All markets' : region} />
            </section>

            <section className="md3-card overflow-hidden">
              <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
                <div className="p-6">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Skill Demand Landscape</h2>
                      <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                        Relative index: the strongest skill in the current filter is 100. Tooltips include the raw score.
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[var(--md3-on-surface-variant)]">{region}</span>
                  </div>

                  {topSignals.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[var(--md3-on-surface-variant)]">No trend data matches the current filters.</p>
                  ) : (
                    <div className="h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSignals} layout="vertical" margin={{ left: 18, right: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#5F6368' }} />
                          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#5F6368' }} />
                          <Tooltip content={<SkillSignalTooltip />} />
                          <Bar dataKey="relativeIndex" radius={[0, 6, 6, 0]}>
                            {topSignals.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] p-6 lg:border-l lg:border-t-0">
                  <h3 className="text-base font-semibold text-[var(--md3-on-surface)]">Market Movers</h3>
                  <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">Ranked skills with latest movement from the previous snapshot.</p>
                  <div className="mt-4 space-y-3">
                    {topSignals.slice(0, 6).map((signal, index) => (
                      <div key={signal.name} className="flex items-center gap-3">
                        <span className="w-5 text-sm font-semibold text-[var(--md3-on-surface-variant)]">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{signal.name}</span>
                            <span className="text-sm font-semibold text-[var(--md3-primary)]">{signal.relativeIndex}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full" style={{ width: `${signal.relativeIndex}%`, backgroundColor: signal.color }} />
                          </div>
                        </div>
                        <DeltaPill delta={signal.delta} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.75fr)]">
              <div className="md3-card p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Momentum Timeline</h2>
                  <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                    Top skills over time, normalized to the highest raw score in this view.
                  </p>
                </div>
                {trendHistory.data.length >= 2 ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendHistory.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5F6368' }} />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#5F6368' }}
                          domain={[0, 100]}
                          label={{ value: 'Relative index', angle: -90, position: 'insideLeft', style: { fill: '#5F6368', fontSize: 12 } }}
                        />
                        <Tooltip content={<TrendHistoryTooltip rawData={trendHistory.rawData} />} />
                        <Legend />
                        {timelineSkills.map((skill, index) => (
                          <Line
                            key={skill}
                            type="monotone"
                            dataKey={skill}
                            stroke={LINE_SERIES_COLORS[index % LINE_SERIES_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-[var(--md3-on-surface-variant)]">Trend history needs at least two snapshot dates.</p>
                )}
              </div>

              <div className="md3-card p-6">
                <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Source Coverage</h2>
                <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">How much each source contributes to this market view.</p>
                {sourceMixData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[var(--md3-on-surface-variant)]">No source data available.</p>
                ) : (
                  <>
                    <div className="mt-4 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={sourceMixData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={2}>
                            {sourceMixData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {sourceMixData.slice(0, 6).map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2 text-[var(--md3-on-surface)]">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="truncate">{entry.name}</span>
                          </span>
                          <span className="font-semibold text-[var(--md3-on-surface)]">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="md3-card p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Raw Trend Records</h2>
                  <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                    {trendList.totalItems} unnormalized record{trendList.totalItems !== 1 ? 's' : ''} behind the charts.
                  </p>
                </div>
                <button
                  type="button"
                  aria-expanded={isRawRecordsOpen}
                  onClick={() => setIsRawRecordsOpen((current) => !current)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--md3-outline)] px-4 text-sm font-medium text-[var(--md3-on-surface-variant)] transition-colors hover:bg-[var(--md3-surface-variant)]"
                >
                  {isRawRecordsOpen ? 'Hide records' : 'Show records'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isRawRecordsOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isRawRecordsOpen && (
                <div className="mt-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                    <AdminFilterSelect
                      value={sortKey}
                      onChange={(value) => setSortKey(value as TrendSort)}
                      options={SORT_OPTIONS}
                      ariaLabel="Sort trend records"
                      label="Sort"
                    />
                    <button
                      type="button"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="min-h-10 rounded-full border border-[var(--md3-outline)] px-4 text-sm font-medium text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]"
                    >
                      {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    </button>
                  </div>

                  {trendList.pagedItems.length > 0 ? (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-[var(--md3-outline-variant)]">
                        <table className="w-full min-w-[760px] border-collapse">
                          <thead className="bg-[var(--md3-surface-container)]">
                            <tr className="text-left text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">
                              <th className="px-4 py-3">Skill</th>
                              <th className="px-4 py-3">Raw score</th>
                              <th className="px-4 py-3">Region</th>
                              <th className="px-4 py-3">Source</th>
                              <th className="px-4 py-3">Snapshot date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trendList.pagedItems.map((trend) => (
                              <tr key={trend.id} className="border-t border-[var(--md3-outline-variant)]">
                                <td className="px-4 py-3">
                                  <SkillChip label={trend.techSkill} size="sm" />
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-[var(--md3-primary)]">{trend.trendScore}/100</td>
                                <td className="px-4 py-3 text-sm text-[var(--md3-on-surface-variant)]">{trend.region ?? 'Global'}</td>
                                <td className="px-4 py-3 text-sm text-[var(--md3-on-surface-variant)]">{trend.source ?? 'Unspecified'}</td>
                                <td className="px-4 py-3 text-sm text-[var(--md3-on-surface-variant)]">{formatDate(trend.snapshotDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <AdminPagination {...trendList} onPageChange={trendList.setPage} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Search className="mx-auto mb-3 h-10 w-10 text-[var(--md3-on-surface-variant)]" />
                        <p className="text-sm text-[var(--md3-on-surface-variant)]">No records match your filters.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="md3-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-[var(--md3-on-surface)]">{value}</p>
      <p className="mt-1 truncate text-sm text-[var(--md3-on-surface-variant)]">{detail}</p>
    </div>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  const isUp = delta > 0;
  const isFlat = delta === 0;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex min-w-14 items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
      isFlat
        ? 'bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)]'
        : isUp
          ? 'bg-[var(--md3-success-container)] text-[var(--md3-success)]'
          : 'bg-[var(--md3-error-container)] text-[var(--md3-error)]'
    }`}>
      {!isFlat && <Icon className="h-3 w-3" />}
      {isFlat ? '0' : `${isUp ? '+' : ''}${delta}`}
    </span>
  );
}

function SkillSignalTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const signal = payload[0]?.payload as SkillSignal | undefined;

  return (
    <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-[var(--md3-on-surface)]">{label}</p>
      <p className="text-xs text-[var(--md3-on-surface-variant)]">Relative index: {payload[0]?.value}</p>
      {signal && (
        <>
          <p className="text-xs text-[var(--md3-on-surface-variant)]">Raw average: {signal.rawScore}/100</p>
          <p className="text-xs text-[var(--md3-on-surface-variant)]">{signal.records} record(s), {signal.sources} source(s)</p>
        </>
      )}
    </div>
  );
}

function TrendHistoryTooltip({
  active,
  payload,
  label,
  rawData,
}: TooltipProps<number, string> & { rawData: TrendHistoryPoint[] }) {
  if (!active || !payload?.length) return null;

  const rawPoint = rawData.find((point) => point.date === label);

  return (
    <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-[var(--md3-on-surface)]">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => {
          const skill = item.dataKey?.toString() ?? '';
          const rawScore = rawPoint?.[skill];

          return (
            <div key={skill} className="text-xs text-[var(--md3-on-surface-variant)]">
              <span className="font-semibold" style={{ color: item.color }}>{skill}: </span>
              <span>index {item.value}</span>
              {typeof rawScore === 'number' && <span> · raw {rawScore}/100</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
