import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2, Map } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { GET_CAREER_ROADMAPS_BY_ROLE, GET_CAREER_ROLES, GET_CAREER_ROADMAP_WITH_NODES } from '@/graphql/queries';

interface CareerRole { id: string; name: string }
interface CareerRoadmap { id: string; name: string; description?: string; careerRoleId: string }
interface RoadmapDto { name: string; description?: string; careerRoleId: string }

export function AdminRoadmapTemplatesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<CareerRoadmap | null>(null);
  const [form, setForm] = useState<RoadmapDto>({ name: '', careerRoleId: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { data: rolesData } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRole[] = (rolesData as { careerRoles?: CareerRole[] })?.careerRoles ?? [];

  const { data: roadmapsData, loading, error, refetch } = useQuery(GET_CAREER_ROADMAPS_BY_ROLE, {
    variables: { careerRoleId: selectedRoleId },
    skip: !selectedRoleId,
  });

  useLazyQuery(GET_CAREER_ROADMAP_WITH_NODES);

  const roadmaps: CareerRoadmap[] = (roadmapsData as { careerRoadmapsByRole?: CareerRoadmap[] })?.careerRoadmapsByRole ?? [];

  const invalidate = () => apolloClient.refetchQueries({ include: [GET_CAREER_ROADMAPS_BY_ROLE] });
  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const createMutation = useMutation({
    mutationFn: (dto: RoadmapDto) => apiClient.post('/api/career-roadmaps', dto),
    onSuccess: async () => { await invalidate(); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RoadmapDto }) => apiClient.put(`/api/career-roadmaps/${id}`, dto),
    onSuccess: async () => { await invalidate(); setEditingRoadmap(null); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/career-roadmaps/${id}`),
    onSuccess: async () => { await invalidate(); setDeleteId(null); },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const handleSave = () => {
    if (editingRoadmap) updateMutation.mutate({ id: editingRoadmap.id, dto: form });
    else createMutation.mutate(form);
  };

  return (
    <AppShell breadcrumb="Admin / Roadmap Templates">
      <div className="app-page">
        <PageHeader
          title="Roadmap Templates"
          description="Manage career roadmap templates and their node assignments."
          actions={<AdminActionButton icon={Plus} label="Create Template" onClick={() => { setEditingRoadmap(null); setForm({ name: '', careerRoleId: selectedRoleId ?? '' }); setShowForm(true); }} />}
        />

        <div className="md3-card p-4 mb-4">
          <p className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">Filter by Career Role</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${selectedRoleId === role.id ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-primary)]' : 'border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)]'}`}>
                {role.name}
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="md3-card p-6">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">{editingRoadmap ? 'Edit Template' : 'Create Template'}</h3>
            <div className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template name" className="md3-field w-full px-4" />
              <input type="text" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="md3-field w-full px-4" />
              <select value={form.careerRoleId} onChange={(e) => setForm({ ...form, careerRoleId: e.target.value })} className="md3-field w-full px-4">
                <option value="">Select Career Role</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <div className="flex gap-3">
                <AdminActionButton icon={Plus} label={createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'} onClick={handleSave} disabled={!form.name || !form.careerRoleId || createMutation.isPending || updateMutation.isPending} />
                <AdminActionButton icon={Trash2} label="Cancel" onClick={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

        {!selectedRoleId ? (
          <EmptyState icon={Map} title="Select a career role" description="Choose a career role above to view its roadmap templates." actionLabel="" onAction={() => {}} />
        ) : loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={Map} title="Failed to load templates" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <div className="md3-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((rm) => (
                  <tr key={rm.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{rm.name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{rm.description ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingRoadmap(rm); setForm({ name: rm.name, description: rm.description, careerRoleId: rm.careerRoleId }); setShowForm(true); }} className="p-2 hover:bg-[var(--md3-primary-container)] rounded-lg"><Pencil className="w-4 h-4 text-[var(--md3-primary)]" /></button>
                        <button onClick={() => setDeleteId(rm.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Template?" message="This will permanently remove the roadmap template." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
