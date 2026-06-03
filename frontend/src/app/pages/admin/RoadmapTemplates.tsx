import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2, Map, Network, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { GET_CAREER_ROADMAPS_BY_ROLE, GET_CAREER_ROLES, GET_CAREER_ROADMAP_WITH_NODES } from '@/graphql/queries';

interface CareerRole { id: string; name: string }
interface CareerRoadmap { id: string; name: string; description?: string; careerRoleId: string }
interface NodeItem { id: string; parentNodeId?: string; name: string; order: number }
interface RoadmapDto { name: string; description?: string; careerRoleId: string }

export function AdminRoadmapTemplatesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<CareerRoadmap | null>(null);
  const [form, setForm] = useState<RoadmapDto>({ name: '', careerRoleId: '' });
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null);
  const [nodeIdInput, setNodeIdInput] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { data: rolesData } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRole[] = (rolesData as { careerRoles?: CareerRole[] })?.careerRoles ?? [];

  const { data: roadmapsData, loading, error, refetch } = useQuery(GET_CAREER_ROADMAPS_BY_ROLE, {
    variables: { careerRoleId: selectedRoleId },
    skip: !selectedRoleId,
  });

  const [loadRoadmapNodes, { data: roadmapNodesData, loading: nodesLoading }] = useLazyQuery(
    GET_CAREER_ROADMAP_WITH_NODES,
    { fetchPolicy: 'network-only' },
  );

  const roadmaps: CareerRoadmap[] = (roadmapsData as { careerRoadmapsByRole?: CareerRoadmap[] })?.careerRoadmapsByRole ?? [];
  const allNodes: NodeItem[] =
    (roadmapNodesData as { careerRoadmapWithNodes?: { nodes: NodeItem[] } })
      ?.careerRoadmapWithNodes?.nodes ?? [];

  // Nodes whose parent is NOT in the returned set are directly-assigned roots.
  const nodeIdSet = new Set(allNodes.map((n) => n.id));
  const assignedRootNodes = allNodes.filter((n) => !n.parentNodeId || !nodeIdSet.has(n.parentNodeId));

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const invalidateList = () => {
    if (selectedRoleId) refetch();
  };

  const reloadNodes = (roadmapId: string) => {
    loadRoadmapNodes({ variables: { roadmapId } });
  };

  const createMutation = useMutation({
    mutationFn: (dto: RoadmapDto) => apiClient.post('/api/career-roadmaps', dto),
    onSuccess: () => { invalidateList(); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RoadmapDto }) => apiClient.put(`/api/career-roadmaps/${id}`, dto),
    onSuccess: () => { invalidateList(); setEditingRoadmap(null); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/career-roadmaps/${id}`),
    onSuccess: () => { invalidateList(); setDeleteId(null); if (expandedRoadmapId === deleteId) setExpandedRoadmapId(null); },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const assignNodeMutation = useMutation({
    mutationFn: ({ roadmapId, nodeId }: { roadmapId: string; nodeId: string }) =>
      apiClient.post(`/api/career-roadmaps/${roadmapId}/nodes/${nodeId}`),
    onSuccess: () => { if (expandedRoadmapId) reloadNodes(expandedRoadmapId); setNodeIdInput(''); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to assign node.'),
  });

  const removeNodeMutation = useMutation({
    mutationFn: ({ roadmapId, nodeId }: { roadmapId: string; nodeId: string }) =>
      apiClient.delete(`/api/career-roadmaps/${roadmapId}/nodes/${nodeId}`),
    onSuccess: () => { if (expandedRoadmapId) reloadNodes(expandedRoadmapId); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove node.'),
  });

  const handleToggleExpand = (rm: CareerRoadmap) => {
    if (expandedRoadmapId === rm.id) {
      setExpandedRoadmapId(null);
      return;
    }
    setExpandedRoadmapId(rm.id);
    loadRoadmapNodes({ variables: { roadmapId: rm.id } });
  };

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
              <button key={role.id} onClick={() => { setSelectedRoleId(role.id); setExpandedRoadmapId(null); }} className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${selectedRoleId === role.id ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-primary)]' : 'border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)]'}`}>
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
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase w-8"></th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Name</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Description</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((rm) => (
                  <>
                    <tr key={rm.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleExpand(rm)}
                          className="p-1 rounded hover:bg-[var(--md3-primary-container)] transition-colors"
                          title="Manage nodes"
                        >
                          {expandedRoadmapId === rm.id
                            ? <ChevronDown className="w-4 h-4 text-[var(--md3-primary)]" />
                            : <ChevronRight className="w-4 h-4 text-[var(--md3-on-surface-variant)]" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{rm.name}</td>
                      <td className="px-4 py-4 text-sm text-[var(--md3-on-surface-variant)]">{rm.description ?? '—'}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingRoadmap(rm); setForm({ name: rm.name, description: rm.description, careerRoleId: rm.careerRoleId }); setShowForm(true); }} className="p-2 hover:bg-[var(--md3-primary-container)] rounded-lg"><Pencil className="w-4 h-4 text-[var(--md3-primary)]" /></button>
                          <button onClick={() => setDeleteId(rm.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedRoadmapId === rm.id && (
                      <tr key={`${rm.id}-nodes`} className="bg-[var(--md3-surface-container)]">
                        <td colSpan={4} className="px-6 py-4 border-b border-[var(--md3-outline-variant)]">
                          <div className="flex items-center gap-2 mb-3">
                            <Network className="w-4 h-4 text-[var(--md3-primary)]" />
                            <span className="text-sm font-semibold text-[var(--md3-on-surface)]">
                              Assigned Nodes
                            </span>
                            <span className="text-xs text-[var(--md3-on-surface-variant)] ml-1">
                              ({allNodes.length} total — {assignedRootNodes.length} root)
                            </span>
                          </div>

                          {nodesLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-8 rounded" />
                              <Skeleton className="h-8 rounded" />
                            </div>
                          ) : assignedRootNodes.length === 0 ? (
                            <p className="text-sm text-[var(--md3-on-surface-variant)] py-1">
                              No nodes assigned. Use the field below to add a root node by ID.
                            </p>
                          ) : (
                            <div className="space-y-1 mb-3">
                              {assignedRootNodes.map((node) => (
                                <div key={node.id} className="flex items-center justify-between rounded-lg bg-white border border-[var(--md3-outline-variant)] px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{node.name}</p>
                                    <p className="text-xs text-[var(--md3-on-surface-variant)] truncate font-mono">{node.id}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeNodeMutation.mutate({ roadmapId: rm.id, nodeId: node.id })}
                                    disabled={removeNodeMutation.isPending}
                                    className="ml-3 shrink-0 p-1.5 rounded hover:bg-[var(--md3-error-container)] transition-colors"
                                    title="Remove node"
                                  >
                                    <X className="w-3.5 h-3.5 text-[var(--md3-error)]" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={nodeIdInput}
                              onChange={(e) => setNodeIdInput(e.target.value)}
                              placeholder="Node ID (UUID) — copy from Node Library"
                              className="md3-field flex-1 px-3 text-sm h-10"
                            />
                            <AdminActionButton
                              icon={Plus}
                              label={assignNodeMutation.isPending ? 'Adding…' : 'Assign'}
                              onClick={() => {
                                if (nodeIdInput.trim()) {
                                  assignNodeMutation.mutate({ roadmapId: rm.id, nodeId: nodeIdInput.trim() });
                                }
                              }}
                              disabled={!nodeIdInput.trim() || assignNodeMutation.isPending}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-[var(--md3-on-surface-variant)]">
                            Assigning a root node automatically includes all its descendants in the roadmap.
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
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
