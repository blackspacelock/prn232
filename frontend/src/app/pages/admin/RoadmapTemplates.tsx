import { Fragment, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2, Map, Network, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { GET_CAREER_ROADMAPS_BY_ROLE, GET_CAREER_ROLES, GET_CAREER_ROADMAP_WITH_NODES } from '@/graphql/queries';
import type { CreateRoadmapNodeDto, RoadmapNodeDto } from '@/types/api';

interface CareerRole { id: string; name: string }
interface CareerRoadmap { id: string; name: string; description?: string; careerRoleId: string }
interface RoadmapDto { name: string; description?: string; careerRoleId: string }
type RoadmapNodeForm = CreateRoadmapNodeDto & { positionXText: string; positionYText: string };

export function AdminRoadmapTemplatesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<CareerRoadmap | null>(null);
  const [form, setForm] = useState<RoadmapDto>({ name: '', careerRoleId: '' });
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null);
  const [roadmapNodeForm, setRoadmapNodeForm] = useState<RoadmapNodeForm>({
    nodeId: '',
    parentRoadmapNodeId: undefined,
    order: 1,
    nodeType: 'Topic',
    requirementType: 'Required',
    positionXText: '',
    positionYText: '',
  });
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
  const roadmapNodes: RoadmapNodeDto[] =
    (roadmapNodesData as { careerRoadmapWithNodes?: { nodes: RoadmapNodeDto[] } })
      ?.careerRoadmapWithNodes?.nodes ?? [];

  const roadmapNodeIdSet = new Set(roadmapNodes.map((n) => n.id));
  const rootRoadmapNodes = roadmapNodes.filter((n) => !n.parentRoadmapNodeId || !roadmapNodeIdSet.has(n.parentRoadmapNodeId));

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
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/career-roadmaps/${id}`),
    onSuccess: () => { invalidateList(); setDeleteId(null); if (expandedRoadmapId === deleteId) setExpandedRoadmapId(null); },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const assignNodeMutation = useMutation({
    mutationFn: ({ roadmapId, dto }: { roadmapId: string; dto: CreateRoadmapNodeDto }) =>
      apiClient.post(`/api/career-roadmaps/${roadmapId}/roadmap-nodes`, dto),
    onSuccess: () => {
      if (expandedRoadmapId) reloadNodes(expandedRoadmapId);
      setRoadmapNodeForm({
        nodeId: '',
        parentRoadmapNodeId: undefined,
        order: roadmapNodeForm.order + 1,
        nodeType: roadmapNodeForm.nodeType,
        requirementType: roadmapNodeForm.requirementType,
        positionXText: '',
        positionYText: '',
      });
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to assign node.'),
  });

  const removeNodeMutation = useMutation({
    mutationFn: ({ roadmapId, roadmapNodeId }: { roadmapId: string; roadmapNodeId: string }) =>
      deleteWithCascadeMode(`/api/career-roadmaps/${roadmapId}/roadmap-nodes/${roadmapNodeId}`),
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
                  <Fragment key={rm.id}>
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
                              ({roadmapNodes.length} total - {rootRoadmapNodes.length} root)
                            </span>
                          </div>

                          {nodesLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-8 rounded" />
                              <Skeleton className="h-8 rounded" />
                            </div>
                          ) : roadmapNodes.length === 0 ? (
                            <p className="text-sm text-[var(--md3-on-surface-variant)] py-1">
                              No roadmap nodes assigned. Use the form below to add one by content node ID.
                            </p>
                          ) : (
                            <div className="space-y-1 mb-3">
                              {roadmapNodes.map((roadmapNode) => (
                                <div key={roadmapNode.id} className="flex items-center justify-between rounded-lg bg-white border border-[var(--md3-outline-variant)] px-3 py-2">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{roadmapNode.node.name}</p>
                                      <span className="rounded bg-[var(--md3-surface-container)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--md3-on-surface-variant)]">
                                        {roadmapNode.nodeType}
                                      </span>
                                      <span className="rounded bg-[var(--md3-surface-container)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--md3-on-surface-variant)]">
                                        {roadmapNode.requirementType}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[var(--md3-on-surface-variant)] truncate font-mono">RoadmapNode: {roadmapNode.id}</p>
                                    <p className="text-xs text-[var(--md3-on-surface-variant)] truncate font-mono">Node: {roadmapNode.nodeId}</p>
                                    <p className="text-xs text-[var(--md3-on-surface-variant)]">
                                      Order {roadmapNode.order}
                                      {roadmapNode.parentRoadmapNodeId ? ` - parent ${roadmapNode.parentRoadmapNodeId}` : ' - root'}
                                      {typeof roadmapNode.positionX === 'number' && typeof roadmapNode.positionY === 'number'
                                        ? ` - (${roadmapNode.positionX}, ${roadmapNode.positionY})`
                                        : ''}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeNodeMutation.mutate({ roadmapId: rm.id, roadmapNodeId: roadmapNode.id })}
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

                          <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_100px_130px_150px]">
                            <input
                              type="text"
                              value={roadmapNodeForm.nodeId}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, nodeId: e.target.value })}
                              placeholder="Content Node ID"
                              className="md3-field px-3 text-sm h-10"
                            />
                            <select
                              value={roadmapNodeForm.parentRoadmapNodeId ?? ''}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, parentRoadmapNodeId: e.target.value || undefined })}
                              className="md3-field px-3 text-sm h-10"
                            >
                              <option value="">Root node</option>
                              {roadmapNodes.map((roadmapNode) => (
                                <option key={roadmapNode.id} value={roadmapNode.id}>
                                  {roadmapNode.node.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={roadmapNodeForm.order}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, order: Number(e.target.value) })}
                              placeholder="Order"
                              className="md3-field px-3 text-sm h-10"
                            />
                            <select
                              value={roadmapNodeForm.nodeType}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, nodeType: e.target.value })}
                              className="md3-field px-3 text-sm h-10"
                            >
                              <option value="Topic">Topic</option>
                              <option value="Group">Group</option>
                              <option value="Milestone">Milestone</option>
                            </select>
                            <select
                              value={roadmapNodeForm.requirementType}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, requirementType: e.target.value })}
                              className="md3-field px-3 text-sm h-10"
                            >
                              <option value="Required">Required</option>
                              <option value="Recommended">Recommended</option>
                              <option value="Optional">Optional</option>
                            </select>
                          </div>
                          <div className="mt-2 grid gap-2 lg:grid-cols-[120px_120px_auto]">
                            <input
                              type="number"
                              value={roadmapNodeForm.positionXText}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, positionXText: e.target.value })}
                              placeholder="X optional"
                              className="md3-field px-3 text-sm h-10"
                            />
                            <input
                              type="number"
                              value={roadmapNodeForm.positionYText}
                              onChange={(e) => setRoadmapNodeForm({ ...roadmapNodeForm, positionYText: e.target.value })}
                              placeholder="Y optional"
                              className="md3-field px-3 text-sm h-10"
                            />
                            <AdminActionButton
                              icon={Plus}
                              label={assignNodeMutation.isPending ? 'Adding...' : 'Assign Roadmap Node'}
                              onClick={() => {
                                if (roadmapNodeForm.nodeId.trim()) {
                                  const dto: CreateRoadmapNodeDto = {
                                    nodeId: roadmapNodeForm.nodeId.trim(),
                                    parentRoadmapNodeId: roadmapNodeForm.parentRoadmapNodeId,
                                    order: roadmapNodeForm.order,
                                    nodeType: roadmapNodeForm.nodeType,
                                    requirementType: roadmapNodeForm.requirementType,
                                    positionX: roadmapNodeForm.positionXText ? Number(roadmapNodeForm.positionXText) : undefined,
                                    positionY: roadmapNodeForm.positionYText ? Number(roadmapNodeForm.positionYText) : undefined,
                                  };
                                  assignNodeMutation.mutate({ roadmapId: rm.id, dto });
                                }
                              }}
                              disabled={!roadmapNodeForm.nodeId.trim() || assignNodeMutation.isPending}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-[var(--md3-on-surface-variant)]">
                            Parent, order, and optional X/Y are roadmap-specific. Learning resources still come from the content node.
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
