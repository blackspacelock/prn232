import { useEffect, useState } from 'react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { apiClient } from '@/lib/axios';
import type {
  CreateJobScrapingSourceDto,
  JobScrapingSettingDto,
  JobScrapingSourceDto,
  UpdateJobScrapingSettingDto,
  UpdateJobScrapingSourceDto,
} from '@/types/api';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
type SourceSortKey = 'name' | 'region' | 'maxPostings' | 'enabled';
const sourceSortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'region', label: 'Region' },
  { value: 'maxPostings', label: 'Max postings' },
  { value: 'enabled', label: 'Status' },
] satisfies Array<{ value: SourceSortKey; label: string }>;

export function AdminSystemConfigPage() {
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState<UpdateJobScrapingSettingDto | null>(null);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSource, setEditingSource] = useState<JobScrapingSourceDto | null>(null);
  const [sourceForm, setSourceForm] = useState<CreateJobScrapingSourceDto>(DEFAULT_SOURCE_FORM);
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceSortKey, setSourceSortKey] = useState<SourceSortKey>('name');
  const [sourceSortDirection, setSourceSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' });

  const showSuccess = (message: string) => setSnackbar({ open: true, message, variant: 'success' });
  const showError = (message: string) => setSnackbar({ open: true, message, variant: 'error' });

  const { data: settings, isLoading: settingsLoading, error: settingsError, refetch: refetchSettings } = useRestQuery({
    queryKey: ['job-scraping-settings'],
    queryFn: () => apiClient.get<JobScrapingSettingDto>('/api/job-trends/scraping-settings').then((r) => r.data),
  });

  const { data: sources, isLoading: sourcesLoading, error: sourcesError, refetch: refetchSources } = useRestQuery({
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

  useEffect(() => {
    if (settings && !settingsForm) {
      setSettingsForm({
        enabled: settings.enabled,
        frequency: settings.frequency,
        timeOfDay: settings.timeOfDay,
        dayOfWeek: settings.dayOfWeek,
      });
    }
  }, [settings, settingsForm]);

  const updateSettingsMutation = useMutation({
    mutationFn: (dto: UpdateJobScrapingSettingDto) => apiClient.put<JobScrapingSettingDto>('/api/job-trends/scraping-settings', dto).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['job-scraping-settings'], updated);
      setSettingsForm({ enabled: updated.enabled, frequency: updated.frequency, timeOfDay: updated.timeOfDay, dayOfWeek: updated.dayOfWeek });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      showSuccess('System configuration saved.');
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save configuration.'),
  });

  const createSourceMutation = useMutation({
    mutationFn: (dto: CreateJobScrapingSourceDto) => apiClient.post<JobScrapingSourceDto>('/api/job-scraping-sources', dto).then((r) => r.data),
    onSuccess: (source) => {
      queryClient.setQueryData<JobScrapingSourceDto[]>(['job-scraping-sources'], (old) => [...(old ?? []), source]);
      setShowSourceForm(false);
      showSuccess('Source added.');
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add source.'),
  });

  const updateSourceMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateJobScrapingSourceDto }) =>
      apiClient.put<JobScrapingSourceDto>(`/api/job-scraping-sources/${id}`, dto).then((r) => r.data),
    onSuccess: (source) => {
      queryClient.setQueryData<JobScrapingSourceDto[]>(['job-scraping-sources'], (old) => (old ?? []).map((s) => (s.id === source.id ? source : s)));
      setEditingSource(null);
      setShowSourceForm(false);
      showSuccess('Source updated.');
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update source.'),
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/job-scraping-sources/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<JobScrapingSourceDto[]>(['job-scraping-sources'], (old) => (old ?? []).filter((source) => source.id !== id));
      setDeleteSourceId(null);
      showSuccess('Source deleted.');
    },
    onError: (e: unknown) => {
      setDeleteSourceId(null);
      showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete source.');
    },
  });

  const beginEditSource = (source: JobScrapingSourceDto) => {
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

  const saveSource = () => {
    if (editingSource) updateSourceMutation.mutate({ id: editingSource.id, dto: sourceForm });
    else createSourceMutation.mutate(sourceForm);
  };

  return (
    <AppShell breadcrumb="Admin / System Config">
      <div className="app-page admin-page">
        <PageHeader
          title="System Config"
          description="Control automation inputs that keep market insight, recommendations, and reports fresh."
          actions={<AdminActionButton icon={Plus} label="Add Source" onClick={() => { setEditingSource(null); setSourceForm(DEFAULT_SOURCE_FORM); setShowSourceForm(true); }} />}
        />

        <section className="admin-panel admin-section">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--md3-on-surface)]">Scraping Schedule</h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)]">Define when SECompass refreshes market demand data.</p>
            </div>
            <SlidersHorizontal className="h-5 w-5 text-[var(--md3-primary)]" />
          </div>

          {settingsLoading || !settingsForm ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : settingsError ? (
            <EmptyState icon={SlidersHorizontal} title="Failed to load settings" description="Please try again." actionLabel="Retry" onAction={refetchSettings} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1.3fr_180px_180px_180px_auto] lg:items-end">
              <ToggleSwitch
                checked={settingsForm.enabled}
                label={settingsForm.enabled ? 'Auto-scraping enabled' : 'Auto-scraping disabled'}
                activeTone="success"
                onChange={() => setSettingsForm({ ...settingsForm, enabled: !settingsForm.enabled })}
              />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Frequency</span>
                <select value={settingsForm.frequency} onChange={(event) => setSettingsForm({ ...settingsForm, frequency: event.target.value as 'Daily' | 'Weekly' })} className="md3-field w-full px-4">
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Day</span>
                <select value={settingsForm.dayOfWeek} onChange={(event) => setSettingsForm({ ...settingsForm, dayOfWeek: event.target.value })} className="md3-field w-full px-4" disabled={settingsForm.frequency !== 'Weekly'}>
                  {DAYS_OF_WEEK.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Time</span>
                <input type="time" value={settingsForm.timeOfDay.slice(0, 5)} onChange={(event) => setSettingsForm({ ...settingsForm, timeOfDay: `${event.target.value}:00` })} className="md3-field w-full px-4" />
              </label>
              <AdminActionButton icon={Save} label={updateSettingsMutation.isPending ? 'Saving...' : 'Save'} onClick={() => updateSettingsMutation.mutate(settingsForm)} disabled={updateSettingsMutation.isPending} />
            </div>
          )}
        </section>

        {showSourceForm && (
          <section className="admin-panel admin-section">
            <h2 className="mb-4 text-base font-semibold text-[var(--md3-on-surface)]">{editingSource ? 'Edit Source' : 'Add Source'}</h2>
            <div className="admin-form-grid">
              <input type="text" value={sourceForm.name} onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })} placeholder="Name" className="md3-field w-full px-4" />
              <input type="text" value={sourceForm.region} onChange={(event) => setSourceForm({ ...sourceForm, region: event.target.value })} placeholder="Region" className="md3-field w-full px-4" />
              <input type="text" value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} placeholder="Listing URL" className="md3-field w-full px-4 lg:col-span-2" />
              <input type="number" value={sourceForm.maxPostings} onChange={(event) => setSourceForm({ ...sourceForm, maxPostings: Number(event.target.value) })} placeholder="Max postings" className="md3-field w-full px-4" min={1} />
              <ToggleSwitch checked={sourceForm.enabled} label={sourceForm.enabled ? 'Enabled' : 'Disabled'} activeTone="success" onChange={() => setSourceForm({ ...sourceForm, enabled: !sourceForm.enabled })} />
              <input type="text" value={sourceForm.jobCardXPath} onChange={(event) => setSourceForm({ ...sourceForm, jobCardXPath: event.target.value })} placeholder="Job card XPath" className="md3-field w-full px-4 lg:col-span-2" />
              <input type="text" value={sourceForm.titleXPath} onChange={(event) => setSourceForm({ ...sourceForm, titleXPath: event.target.value })} placeholder="Title XPath" className="md3-field w-full px-4 lg:col-span-2" />
              <input type="text" value={sourceForm.tagsXPath} onChange={(event) => setSourceForm({ ...sourceForm, tagsXPath: event.target.value })} placeholder="Tags XPath" className="md3-field w-full px-4 lg:col-span-2" />
            </div>
            <div className="mt-4 flex gap-3">
              <AdminActionButton icon={Save} label={createSourceMutation.isPending || updateSourceMutation.isPending ? 'Saving...' : 'Save Source'} onClick={saveSource} disabled={!sourceForm.name || !sourceForm.url || createSourceMutation.isPending || updateSourceMutation.isPending} />
              <AdminActionButton icon={X} label="Cancel" onClick={() => { setShowSourceForm(false); setEditingSource(null); }} />
            </div>
          </section>
        )}

        <section className="admin-panel admin-table-card">
          {sourcesLoading ? (
            <div className="p-4"><Skeleton className="h-20 rounded-lg" /></div>
          ) : sourcesError ? (
            <EmptyState icon={SlidersHorizontal} title="Failed to load sources" description="Please try again." actionLabel="Retry" onAction={refetchSources} />
          ) : (
            <>
              <div className="p-4">
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
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Source</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Region</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Max</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceList.pagedItems.map((source) => (
                    <tr key={source.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[var(--md3-on-surface)]">{source.name}</p>
                        <p className="max-w-lg truncate text-xs text-[var(--md3-on-surface-variant)]">{source.url}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{source.region}</td>
                      <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{source.maxPostings}</td>
                      <td className="px-6 py-4">
                        <ToggleSwitch checked={source.enabled} label={source.enabled ? 'Enabled' : 'Disabled'} activeTone="success" onChange={() => updateSourceMutation.mutate({ id: source.id, dto: { enabled: !source.enabled } })} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => beginEditSource(source)} className="rounded-md p-2 text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]"><Save className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setDeleteSourceId(source.id)} className="rounded-md p-2 text-[var(--md3-error)] hover:bg-[var(--md3-error-container)]"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AdminPagination {...sourceList} onPageChange={sourceList.setPage} />
            </>
          )}
        </section>

        <ConfirmDialog isOpen={deleteSourceId !== null} title="Delete Scraping Source?" message="This source will no longer feed Market Pulse data." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteSourceId) deleteSourceMutation.mutate(deleteSourceId); }} onCancel={() => setDeleteSourceId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'success' })} />
      </div>
    </AppShell>
  );
}
