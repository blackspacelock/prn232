import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { Plus, Pencil, Trash2, TrendingUp, RefreshCw } from 'lucide-react';
import { AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { AdminField, AdminFormDialog } from '../../components/admin/AdminFormDialog';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { SkillChip } from '../../components/SkillChip';
import type {
  JobTrendScrapeResultDto,
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
  const queryClient = useQueryClient();
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

  const showError = (msg: string) => setSnackbar({ open: true, message: msg, variant: 'error' });
  const showSuccess = (msg: string) => setSnackbar({ open: true, message: msg, variant: 'success' });

  const { data: trendsData, isLoading: loading, error, refetch } = useRestQuery({
    queryKey: ['admin-job-trends'],
    queryFn: () => apiClient.get<JobTrend[]>('/api/job-trends').then((r) => r.data),
  });
  const trends: JobTrend[] = trendsData ?? [];
  const trendList = useAdminList({
    items: trends,
    searchText: trendSearch,
    sortKey: trendSortKey,
    sortDirection: trendSortDirection,
    pageSize: 20,
    searchPredicate: (trend, term) => `${trend.techSkill} ${trend.region ?? ''} ${trend.source ?? ''} ${trend.description ?? ''}`.toLowerCase().includes(term),
    getSortValue: (trend, key) => key === 'snapshotDate' ? new Date(trend.snapshotDate) : trend[key],
  });

  const createMutation = useMutation({
    mutationFn: (dto: JobTrendDto) => apiClient.post<JobTrend>('/api/job-trends', dto).then((r) => r.data),
    onSuccess: (trend) => {
      queryClient.setQueryData<JobTrend[]>(['admin-job-trends'], (old) => [...(old ?? []), trend]);
      setShowForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: JobTrendDto }) => apiClient.put<JobTrend>(`/api/job-trends/${id}`, dto).then((r) => r.data),
    onSuccess: (trend) => {
      queryClient.setQueryData<JobTrend[]>(['admin-job-trends'], (old) => (old ?? []).map((t) => (t.id === trend.id ? trend : t)));
      setEditingTrend(null);
      setShowForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/job-trends/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<JobTrend[]>(['admin-job-trends'], (old) => (old ?? []).filter((t) => t.id !== id));
      setDeleteId(null);
    },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const handleSave = () => {
    if (editingTrend) updateMutation.mutate({ id: editingTrend.id, dto: form });
    else createMutation.mutate(form);
  };

  const scrapeMutation = useMutation({
    mutationFn: () => apiClient.post<JobTrendScrapeResultDto>('/api/job-trends/scrape').then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-trends'] });
      showSuccess(`Scraped ${result.totalPostingsScraped} postings — ${result.trendsCreated} trends created, ${result.trendsUpdated} updated.`);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to scrape job trends.'),
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
        </div>

        <AdminFormDialog
          isOpen={showSourceForm}
          title={editingSource ? 'Edit Source' : 'Add Source'}
          description="Configure the job board and selectors used by scraping."
          submitLabel="Save Source"
          isSubmitting={createSourceMutation.isPending || updateSourceMutation.isPending}
          submitDisabled={!sourceForm.name.trim() || !sourceForm.url.trim()}
          onSubmit={handleSaveSource}
          onCancel={() => { setShowSourceForm(false); setEditingSource(null); }}
        >
          <div className="admin-form-grid">
            <AdminField label="Source name" description="Internal display name for this job board or listing source." required>
              <input type="text" value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} placeholder="Name (e.g. ITviec)" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Region" description="Market region represented by this source.">
              <input type="text" value={sourceForm.region} onChange={(e) => setSourceForm({ ...sourceForm, region: e.target.value })} placeholder="Region (e.g. Vietnam)" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Listing URL" description="Page URL the scraper will visit to collect job postings." required>
              <input type="text" value={sourceForm.url} onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })} placeholder="Listing URL" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Max postings" description="Upper limit of job cards to read from this source per scrape run.">
              <input type="number" value={sourceForm.maxPostings} onChange={(e) => setSourceForm({ ...sourceForm, maxPostings: Number(e.target.value) })} placeholder="Max Postings" className="md3-field w-full px-4" min={1} />
            </AdminField>
            <AdminField label="Status" description="Disabled sources stay configured but are skipped during scraping.">
              <ToggleSwitch checked={sourceForm.enabled} label={sourceForm.enabled ? 'Enabled' : 'Disabled'} activeTone="success" onChange={() => setSourceForm({ ...sourceForm, enabled: !sourceForm.enabled })} />
            </AdminField>
            <AdminField label="Job card XPath" description="XPath selector for each individual posting card on the listing page.">
              <input type="text" value={sourceForm.jobCardXPath} onChange={(e) => setSourceForm({ ...sourceForm, jobCardXPath: e.target.value })} placeholder="Job Card XPath" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Title XPath" description="XPath selector for the job title within each posting card.">
              <input type="text" value={sourceForm.titleXPath} onChange={(e) => setSourceForm({ ...sourceForm, titleXPath: e.target.value })} placeholder="Title XPath" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Tags XPath" description="XPath selector for skill tags or technology text within each posting card.">
              <input type="text" value={sourceForm.tagsXPath} onChange={(e) => setSourceForm({ ...sourceForm, tagsXPath: e.target.value })} placeholder="Tags XPath" className="md3-field w-full px-4" />
            </AdminField>
          </div>
        </AdminFormDialog>

        <AdminFormDialog
          isOpen={showForm}
          title={editingTrend ? 'Edit Trend' : 'Add Trend'}
          description="Trend scores power market pulse and roadmap recommendations."
          submitLabel="Save Trend"
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitDisabled={!form.techSkill.trim()}
          onSubmit={handleSave}
          onCancel={() => { setShowForm(false); setEditingTrend(null); }}
        >
          <div className="admin-form-grid">
            <AdminField label="Tech skill" description="Skill or technology represented by this market signal." required>
              <input type="text" value={form.techSkill} onChange={(e) => setForm({ ...form, techSkill: e.target.value })} placeholder="Tech Skill (e.g. React)" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Trend score" description="Demand score from 0 to 100; higher values are surfaced more strongly." required>
              <input type="number" value={form.trendScore} onChange={(e) => setForm({ ...form, trendScore: Number(e.target.value) })} placeholder="Score (0-100)" className="md3-field w-full px-4" min={0} max={100} />
            </AdminField>
            <AdminField label="Region" description="Market area this trend belongs to.">
              <input type="text" value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Region" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Source" description="Origin of the signal, such as a job board or manual analysis.">
              <input type="text" value={form.source ?? ''} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Snapshot date" description="Date this trend score was observed or curated.">
              <input type="date" value={form.snapshotDate} onChange={(e) => setForm({ ...form, snapshotDate: e.target.value })} className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Description" description="Optional explanation shown to admins when reviewing the signal.">
              <input type="text" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="md3-field w-full px-4" />
            </AdminField>
          </div>
        </AdminFormDialog>

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
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Snapshot</th>
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
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{new Date(trend.snapshotDate).toLocaleDateString()}</td>
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
