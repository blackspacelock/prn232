import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { appendCachedListItem, removeCachedListItem, replaceCachedListItem } from '@/lib/apolloCache';
import { GET_JOB_TRENDS_BY_REGION } from '@/graphql/queries';

interface JobTrend { id: string; techSkill: string; description?: string; source?: string; region?: string; trendScore: number; snapshotDate: string }
interface JobTrendDto { techSkill: string; description?: string; source?: string; region?: string; trendScore: number; snapshotDate: string }

export function AdminJobTrendsPage() {
  const [region] = useState('Vietnam');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrend, setEditingTrend] = useState<JobTrend | null>(null);
  const [form, setForm] = useState<JobTrendDto>({ techSkill: '', trendScore: 80, snapshotDate: new Date().toISOString().split('T')[0] });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { data, loading, error, refetch } = useQuery(GET_JOB_TRENDS_BY_REGION, { variables: { region } });
  const trends: JobTrend[] = (data as { jobTrendsByRegion?: JobTrend[] })?.jobTrendsByRegion ?? [];

  const trendsQueryOptions = { query: GET_JOB_TRENDS_BY_REGION, variables: { region } };
  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

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

  return (
    <AppShell breadcrumb="Admin / Job Trends">
      <div className="app-page">
        <PageHeader
          title="Job Trends"
          description="Manage market demand data for tech skills."
          actions={<AdminActionButton icon={Plus} label="Add Trend" onClick={() => { setEditingTrend(null); setForm({ techSkill: '', trendScore: 80, snapshotDate: new Date().toISOString().split('T')[0] }); setShowForm(true); }} />}
        />

        {showForm && (
          <div className="md3-card p-6">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">{editingTrend ? 'Edit Trend' : 'Add Trend'}</h3>
            <div className="grid grid-cols-2 gap-3">
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
          <div className="md3-card overflow-hidden">
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
                {trends.map((trend) => (
                  <tr key={trend.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{trend.techSkill}</td>
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
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Trend?" message="This will permanently remove the job trend." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
