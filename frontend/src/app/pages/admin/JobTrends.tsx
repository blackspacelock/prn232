import { useEffect, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { Plus, Pencil, Trash2, TrendingUp, RefreshCw, Save, X } from 'lucide-react';
import { AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { useQuery } from '@apollo/client/react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { appendCachedListItem, removeCachedListItem, replaceCachedListItem } from '@/lib/apolloCache';
import { GET_JOB_TRENDS_BY_REGION } from '@/graphql/queries';
import { SkillChip } from '../../components/SkillChip';
import type {
  JobTrendScrapeResultDto,
  JobScrapingSettingDto,
  UpdateJobScrapingSettingDto,
  JobScrapingSourceDto,
  CreateJobScrapingSourceDto,
  UpdateJobScrapingSourceDto,
} from '@/types/api';

const DEFAULT_SOURCE_FORM: CreateJobScrapingSourceDto = {
  name: '',
  region: '',
  enabled: true,
  url: '',
  jobCardXPath: '',
  titleXPath: '',
  tagsXPath: '',
  maxPostings: 40,
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface JobTrend { id: string; techSkill: string; description?: string; source?: string; region?: string; trendScore: number; snapshotDate: string }
interface JobTrendDto { techSkill: string; description?: string; source?: string; region?: string; trendScore: number; snapshotDate: string }
type TrendSortKey = 'techSkill' | 'region' | 'trendScore' | 'source' | 'snapshotDate';
type SourceSortKey = 'name' | 'region' | 'maxPostings' | 'enabled';
const trendSortOptions = [
  { value: 'techSkill', label: 'Skill' },
  { value: 'region', label: 'Region' },
  { value: 'trendScore', label: 'Score' },
  { value: 'source', label: 'Source' },
  { value: 'snapshotDate', label: 'Snapshot date' },
] satisfies Array<{ value: TrendSortKey; label: string }>;
const sourceSortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'region', label: 'Region' },
  { value: 'maxPostings', label: 'Max postings' },
  { value: 'enabled', label: 'Status' },
] satisfies Array<{ value: SourceSortKey; label: string }>;

export function AdminJobTrendsPage() {
  const [region] = useState('Vietnam');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrend, setEditingTrend] = useState<JobTrend | null>(null);
  const [trendSearch, setTrendSearch] = useState('');
  const [trendSortKey, setTrendSortKey] = useState<TrendSortKey>('trendScore');
  const [trendSortDirection, setTrendSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceSortKey, setSourceSortKey] = useState<SourceSortKey>('name');
  const [sourceSortDirection, setSourceSortDirection] = useState<'asc' | 'desc'>('asc');
  const [form, setForm] = useState<JobTrendDto>({ techSkill: '', trendScore: 80, snapshotDate: new Date().toISOString().split('T')[0] });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'error' });

  const { data, loading, error, refetch } = useQuery(GET_JOB_TRENDS_BY_REGION, { variables: { region } });
  const trends: JobTrend[] = (data as { jobTrendsByRegion?: JobTrend[] })?.jobTrendsByRegion ?? [];
  const trendList = useAdminList({
    items: trends,
    searchText: trendSearch,
    sortKey: trendSortKey,
    sortDirection: trendSortDirection,
    pageSize: 20,
    searchPredicate: (trend, term) => `${trend.techSkill} ${trend.region ?? ''} ${trend.source ?? ''} ${trend.description ?? ''}`.toLowerCase().includes(term),
    getSortValue: (trend, key) => key === 'snapshotDate' ? new Date(trend.snapshotDate) : trend[key],
  });

  const trendsQueryOptions = { query: GET_JOB_TRENDS_BY_REGION, variables: { region } };
  const showError = (msg: string) => setSnackbar({ open: true, message: msg, variant: 'error' });
  const showSuccess = (msg: string) => setSnackbar({ open: true, message: msg, variant: 'success' });

  const createMutation = useMutation({
    mutationFn: (dto: JobTrendDto) => apiClient.post<JobTrend>('/api/job-trends', dto).then((r) => r.data),
    onSuccess: (trend) => { appendCachedListItem<JobTrend>(trendsQueryOptions, 'jobTrendsByRegion', trend); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: JobTrendDto }) => apiClient.put<JobTrend>(`/api/job-trends/${id}`, dto).then((r) => r.data),
    onSuccess: (trend) => { replaceCachedListItem<JobTrend>(trendsQueryOptions, 'jobTrendsByRegion', trend); setEditingTrend(null); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/job-trends/${id}`),
    onSuccess: (_data, id) => { removeCachedListItem<JobTrend>(trendsQueryOptions, 'jobTrendsByRegion', id); setDeleteId(null); },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const handleSave = () => {
    if (editingTrend) updateMutation.mutate({ id: editingTrend.id, dto: form });
    else createMutation.mutate(form);
  };

  const scrapeMutation = useMutation({
    mutationFn: () => apiClient.post<JobTrendScrapeResultDto>('/api/job-trends/scrape').then((r) => r.data),
    onSuccess: (result) => {
      refetch();
      showSuccess(`Scraped ${result.totalPostingsScraped} postings — ${result.trendsCreated} trends created, ${result.trendsUpdated} updated.`);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to scrape job trends.'),
  });

  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading } = useRestQuery({
    queryKey: ['job-scraping-settings'],
    queryFn: () => apiClient.get<JobScrapingSettingDto>('/api/job-trends/scraping-settings').then((r) => r.data),
  });

  const [settingsForm, setSettingsForm] = useState<UpdateJobScrapingSettingDto | null>(null);

  useEffect(() => {
    if (settings && !settingsForm) {
      setSettingsForm({ enabled: settings.enabled, frequency: settings.frequency, timeOfDay: settings.timeOfDay, dayOfWeek: settings.dayOfWeek });
    }
  }, [settings, settingsForm]);

  const updateSettingsMutation = useMutation({
    mutationFn: (dto: UpdateJobScrapingSettingDto) => apiClient.put<JobScrapingSettingDto>('/api/job-trends/scraping-settings', dto).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['job-scraping-settings'], updated);
      setSettingsForm({ enabled: updated.enabled, frequency: updated.frequency, timeOfDay: updated.timeOfDay, dayOfWeek: updated.dayOfWeek });
      showSuccess('Scraping schedule updated.');
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update scraping schedule.'),
  });

  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSource, setEditingSource] = useState<JobScrapingSourceDto | null>(null);
  const [sourceForm, setSourceForm] = useState<CreateJobScrapingSourceDto>(DEFAULT_SOURCE_FORM);
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);

  const { data: sources, isLoading: sourcesLoading } = useRestQuery({
    queryKey: ['job-scraping-sources'],
    queryFn: () => apiClient.get<JobScrapingSourceDto[]>('/api/job-scraping-sources').then((r) => r.data),
  });
  const sourceList = useAdminList({
    items: sources ?? [],
    searchText: sourceSearch,
    sortKey: sourceSortKey,
    sortDirection: sourceSortDirection,
    pageSize: 20,
    searchPredicate: (source, term) => `${source.name} ${source.region} ${source.url}`.toLowerCase().includes(term),
    getSortValue: (source, key) => source[key],
  });

  const createSourceMutation = useMutation({
    mutationFn: (dto: CreateJobScrapingSourceDto) => apiClient.post<JobScrapingSourceDto>('/api/job-scraping-sources', dto).then((r) => r.data),
    onSuccess: (source) => {
      queryClient.setQueryData<JobScrapingSourceDto[]>(['job-scraping-sources'], (old) => [...(old ?? []), source]);
      setShowSourceForm(false);
      showSuccess('Scraping source added.');
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add scraping source.'),
  });

  const updateSourceMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateJobScrapingSourceDto }) =>
      apiClient.put<JobScrapingSourceDto>(`/api/job-scraping-sources/${id}`, dto).then((r) => r.data),
    onSuccess: (source) => {
      queryClient.setQueryData<JobScrapingSourceDto[]>(['job-scraping-sources'], (old) =>
        (old ?? []).map((s) => (s.id === source.id ? source : s)),
      );
      setEditingSource(null);
      setShowSourceForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update scraping source.'),
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/job-scraping-sources/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<JobScrapingSourceDto[]>(['job-scraping-sources'], (old) => (old ?? []).filter((s) => s.id !== id));
      setDeleteSourceId(null);
    },
    onError: (e: unknown) => {
      showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete scraping source.');
      setDeleteSourceId(null);
    },
  });

  const handleSaveSource = () => {
    if (editingSource) updateSourceMutation.mutate({ id: editingSource.id, dto: sourceForm });
    else createSourceMutation.mutate(sourceForm);
  };

  const toggleSourceEnabled = (source: JobScrapingSourceDto) => {
    updateSourceMutation.mutate({ id: source.id, dto: { enabled: !source.enabled } });
  };

  const startEditSource = (source: JobScrapingSourceDto) => {
    setEditingSource(source);
    setSourceForm({
      name: source.name,
      region: source.region,
      enabled: source.enabled,
      url: source.url,
      jobCardXPath: source.jobCardXPath,
      titleXPath: source.titleXPath,
      tagsXPath: source.tagsXPath,
      maxPostings: source.maxPostings,
    });
    setShowSourceForm(true);
  };

  return (
    <AppShell breadcrumb="Admin / Job Trends">
      <div className="app-page admin-page">
        <PageHeader
          title="Job Trends"
          description="Manage market demand data for tech skills."
          actions={
            <>
              <AdminActionButton
                icon={RefreshCw}
                label={scrapeMutation.isPending ? 'Scraping...' : 'Scrape Now'}
                variant="tonal"
                onClick={() => scrapeMutation.mutate()}
                disabled={scrapeMutation.isPending}
              />
              <AdminActionButton icon={Plus} label="Add Trend" onClick={() => { setEditingTrend(null); setForm({ techSkill: '', trendScore: 80, snapshotDate: new Date().toISOString().split('T')[0] }); setShowForm(true); }} />
            </>
          }
        />

        <div className="admin-panel admin-section">
          <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-1">Scraping Schedule</h3>
          <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
            Configure how often job postings are automatically scraped to refresh trend data.
          </p>

          {settingsLoading || !settingsForm ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <ToggleSwitch
                  checked={settingsForm.enabled}
                  label={settingsForm.enabled ? 'Auto-scraping enabled' : 'Auto-scraping disabled'}
                  onChange={() => setSettingsForm({ ...settingsForm, enabled: !settingsForm.enabled })}
                />

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Frequency</span>
                  <select
                    value={settingsForm.frequency}
                    onChange={(e) => setSettingsForm({ ...settingsForm, frequency: e.target.value as 'Daily' | 'Weekly' })}
                    className="md3-field px-4"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </label>

                {settingsForm.frequency === 'Weekly' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Day of week</span>
                    <select
                      value={settingsForm.dayOfWeek}
                      onChange={(e) => setSettingsForm({ ...settingsForm, dayOfWeek: e.target.value })}
                      className="md3-field px-4"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Time of day</span>
                  <input
                    type="time"
                    value={settingsForm.timeOfDay.slice(0, 5)}
                    onChange={(e) => setSettingsForm({ ...settingsForm, timeOfDay: `${e.target.value}:00` })}
                    className="md3-field px-4"
                  />
                </label>

                <AdminActionButton
                  icon={Save}
                  label={updateSettingsMutation.isPending ? 'Saving...' : 'Save Schedule'}
                  onClick={() => updateSettingsMutation.mutate(settingsForm)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>

              <p className="mt-3 text-xs text-[var(--md3-on-surface-variant)]">
                Last run: {settings?.lastRunAt ? new Date(settings.lastRunAt).toLocaleString() : 'Never'}
              </p>
            </>
          )}
        </div>

        <div className="admin-panel admin-section">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)]">Scraping Sources</h3>
            <AdminActionButton
              icon={Plus}
              label="Add Source"
              variant="tonal"
              onClick={() => { setEditingSource(null); setSourceForm(DEFAULT_SOURCE_FORM); setShowSourceForm(true); }}
            />
          </div>
          <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
            Job boards scraped weekly for Market Pulse trend data, including each board's selectors.
          </p>

          {sourcesLoading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--md3-outline-variant)]">
              <div className="p-3">
                <AdminListToolbar
                  search={sourceSearch}
                  onSearchChange={setSourceSearch}
                  searchPlaceholder="Search sources..."
                  sortKey={sourceSortKey}
                  onSortKeyChange={setSourceSortKey}
                  sortDirection={sourceSortDirection}
                  onSortDirectionChange={setSourceSortDirection}
                  sortOptions={sourceSortOptions}
                />
              </div>
              <table className="w-full">
                <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Region</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">URL</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Max Postings</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceList.pagedItems.map((source) => (
                    <tr key={source.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                      <td className="px-6 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{source.name}</td>
                      <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{source.region}</td>
                      <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)] max-w-xs truncate" title={source.url}>{source.url}</td>
                      <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{source.maxPostings}</td>
                      <td className="px-6 py-4">
                        <ToggleSwitch
                          checked={source.enabled}
                          label={source.enabled ? 'Enabled' : 'Disabled'}
                          activeTone="success"
                          onChange={() => toggleSourceEnabled(source)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEditSource(source)} className="p-2 hover:bg-[var(--md3-primary-container)] rounded-lg"><Pencil className="w-4 h-4 text-[var(--md3-primary)]" /></button>
                          <button onClick={() => setDeleteSourceId(source.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AdminPagination {...sourceList} onPageChange={sourceList.setPage} />
            </div>
          )}

          {showSourceForm && (
            <div className="mt-4 border-t border-[var(--md3-outline-variant)] pt-4">
              <h4 className="text-sm font-medium text-[var(--md3-on-surface)] mb-3">{editingSource ? 'Edit Source' : 'Add Source'}</h4>
              <div className="admin-form-grid">
                <input type="text" value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} placeholder="Name (e.g. ITviec)" className="md3-field w-full px-4" />
                <input type="text" value={sourceForm.region} onChange={(e) => setSourceForm({ ...sourceForm, region: e.target.value })} placeholder="Region (e.g. Vietnam)" className="md3-field w-full px-4" />
                <input type="text" value={sourceForm.url} onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })} placeholder="Listing URL" className="md3-field w-full px-4 col-span-2" />
                <input type="number" value={sourceForm.maxPostings} onChange={(e) => setSourceForm({ ...sourceForm, maxPostings: Number(e.target.value) })} placeholder="Max Postings" className="md3-field w-full px-4" min={1} />
                <ToggleSwitch
                  checked={sourceForm.enabled}
                  label={sourceForm.enabled ? 'Enabled' : 'Disabled'}
                  activeTone="success"
                  onChange={() => setSourceForm({ ...sourceForm, enabled: !sourceForm.enabled })}
                />
                <input type="text" value={sourceForm.jobCardXPath} onChange={(e) => setSourceForm({ ...sourceForm, jobCardXPath: e.target.value })} placeholder="Job Card XPath" className="md3-field w-full px-4 col-span-2" />
                <input type="text" value={sourceForm.titleXPath} onChange={(e) => setSourceForm({ ...sourceForm, titleXPath: e.target.value })} placeholder="Title XPath" className="md3-field w-full px-4 col-span-2" />
                <input type="text" value={sourceForm.tagsXPath} onChange={(e) => setSourceForm({ ...sourceForm, tagsXPath: e.target.value })} placeholder="Tags XPath" className="md3-field w-full px-4 col-span-2" />
              </div>
              <div className="flex gap-3 mt-4">
                <AdminActionButton
                  icon={Save}
                  label={createSourceMutation.isPending || updateSourceMutation.isPending ? 'Saving...' : 'Save'}
                  onClick={handleSaveSource}
                  disabled={!sourceForm.name || !sourceForm.url || createSourceMutation.isPending || updateSourceMutation.isPending}
                />
                <AdminActionButton icon={X} label="Cancel" onClick={() => { setShowSourceForm(false); setEditingSource(null); }} />
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="admin-panel admin-section">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">{editingTrend ? 'Edit Trend' : 'Add Trend'}</h3>
            <div className="admin-form-grid">
              <input type="text" value={form.techSkill} onChange={(e) => setForm({ ...form, techSkill: e.target.value })} placeholder="Tech Skill (e.g. React)" className="md3-field w-full px-4" />
              <input type="number" value={form.trendScore} onChange={(e) => setForm({ ...form, trendScore: Number(e.target.value) })} placeholder="Score (0-100)" className="md3-field w-full px-4" min={0} max={100} />
              <input type="text" value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Region" className="md3-field w-full px-4" />
              <input type="text" value={form.source ?? ''} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source" className="md3-field w-full px-4" />
              <input type="date" value={form.snapshotDate} onChange={(e) => setForm({ ...form, snapshotDate: e.target.value })} className="md3-field w-full px-4" />
              <input type="text" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="md3-field w-full px-4" />
            </div>
            <div className="flex gap-3 mt-4">
              <AdminActionButton icon={Plus} label={createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'} onClick={handleSave} disabled={!form.techSkill || createMutation.isPending || updateMutation.isPending} />
              <AdminActionButton icon={Trash2} label="Cancel" onClick={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={TrendingUp} title="Failed to load trends" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <div className="admin-panel admin-table-card">
            <div className="p-4">
              <AdminListToolbar
                search={trendSearch}
                onSearchChange={setTrendSearch}
                searchPlaceholder="Search trends..."
                sortKey={trendSortKey}
                onSortKeyChange={setTrendSortKey}
                sortDirection={trendSortDirection}
                onSortDirectionChange={setTrendSortDirection}
                sortOptions={trendSortOptions}
              />
            </div>
            <table className="w-full">
              <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Skill</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Region</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Source</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trendList.pagedItems.map((trend) => (
                  <tr key={trend.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                    <td className="px-6 py-4">
                      <SkillChip label={trend.techSkill} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{trend.region ?? '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--md3-primary)]">{trend.trendScore}</td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{trend.source ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingTrend(trend); setForm({ techSkill: trend.techSkill, trendScore: trend.trendScore, snapshotDate: trend.snapshotDate.split('T')[0], region: trend.region, source: trend.source, description: trend.description }); setShowForm(true); }} className="p-2 hover:bg-[var(--md3-primary-container)] rounded-lg"><Pencil className="w-4 h-4 text-[var(--md3-primary)]" /></button>
                        <button onClick={() => setDeleteId(trend.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination {...trendList} onPageChange={trendList.setPage} />
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Trend?" message="This will permanently remove the job trend." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <ConfirmDialog isOpen={deleteSourceId !== null} title="Delete Scraping Source?" message="This will permanently remove this job board from the weekly scrape." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteSourceId) deleteSourceMutation.mutate(deleteSourceId); }} onCancel={() => setDeleteSourceId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'error' })} />
      </div>
    </AppShell>
  );
}
