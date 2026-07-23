import { useMemo, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { AdminDetailDialog, AdminInspectorSection } from '../../components/admin/AdminDetailDialog';
import { AdminFilterSelect, AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { Eye, GitBranch, Hash, Plus, Save, Trash2, Map as MapIcon, Network } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { apolloClient } from '@/lib/apollo';
import { GET_CAREER_ROLES, GET_CAREER_ROADMAP_WITH_NODES } from '@/graphql/queries';
import { RoadmapCanvasHeader } from '../../components/roadmap/RoadmapCanvasHeader';
import { RoadmapGraphCanvas, type RoadmapGraphNode } from '../../components/roadmap/RoadmapGraphCanvas';
import type { CreateRoadmapNodeDto, RoadmapNodeDto } from '@/types/api';
import type { NodeStatusInt } from '@/constants/nodeStatus';

interface CareerRole { id: string; name: string }
interface CareerRoadmap { id: string; name: string; description?: string; careerRoleId: string; isCustom?: boolean; createdAt: string }
interface RoadmapDto { name: string; description?: string; careerRoleId: string }
type RoadmapNodeForm = CreateRoadmapNodeDto & { positionXText: string; positionYText: string };
type RoadmapSortKey = 'name' | 'createdAt';
const roadmapSortOptions = [
  { value: 'name', label: 'Template name' },
  { value: 'createdAt', label: 'Created date' },
] satisfies Array<{ value: RoadmapSortKey; label: string }>;

function getNodeDepths(nodes: RoadmapNodeDto[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depthById = new Map<string, number>();

  const resolveDepth = (node: RoadmapNodeDto, visiting = new Set<string>()): number => {
    if (depthById.has(node.id)) return depthById.get(node.id)!;
    if (!node.parentRoadmapNodeId || !byId.has(node.parentRoadmapNodeId) || visiting.has(node.id)) {
      depthById.set(node.id, 0);
      return 0;
    }
    visiting.add(node.id);
    const depth = resolveDepth(byId.get(node.parentRoadmapNodeId)!, visiting) + 1;
    depthById.set(node.id, depth);
    return depth;
  };

  nodes.forEach((node) => resolveDepth(node));
  return depthById;
}

function getTemplatePreviewStatus(depth: number): NodeStatusInt {
  if (depth === 0) return 4;
  if (depth === 1) return 1;
  if (depth === 2) return 2;
  if (depth === 3) return 3;
  return 0;
}

export function AdminRoadmapTemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<CareerRoadmap | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RoadmapSortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [form, setForm] = useState<RoadmapDto>({ name: '', careerRoleId: '' });
  const [previewRoadmap, setPreviewRoadmap] = useState<CareerRoadmap | null>(null);
  const [selectedRoadmapNode, setSelectedRoadmapNode] = useState<RoadmapNodeDto | null>(null);
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

  const { data: roadmaps = [], isLoading: loading, error, refetch } = useRestQuery({
    queryKey: ['admin-career-roadmaps'],
    queryFn: () => apiClient.get<CareerRoadmap[]>('/api/career-roadmaps').then((r) => r.data),
  });

  const [loadRoadmapNodes, { data: roadmapNodesData, loading: nodesLoading }] = useLazyQuery(
    GET_CAREER_ROADMAP_WITH_NODES,
    { fetchPolicy: 'network-only' },
  );

  const filteredRoadmaps = selectedRoleId === 'All'
    ? roadmaps
    : roadmaps.filter((roadmap) => roadmap.careerRoleId === selectedRoleId);
  const roadmapList = useAdminList({
    items: filteredRoadmaps,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (roadmap, term) => {
      const roleName = roles.find((role) => role.id === roadmap.careerRoleId)?.name ?? '';
      return `${roadmap.name} ${roadmap.description ?? ''} ${roleName}`.toLowerCase().includes(term);
    },
    getSortValue: (roadmap, key) => key === 'createdAt' ? new Date(roadmap.createdAt) : roadmap.name,
  });
  const roadmapNodes: RoadmapNodeDto[] =
    (roadmapNodesData as { careerRoadmapWithNodes?: { nodes: RoadmapNodeDto[] } })
      ?.careerRoadmapWithNodes?.nodes ?? [];
  const roadmapEdges =
    (roadmapNodesData as { careerRoadmapWithNodes?: { edges?: Array<{ id: string; fromRoadmapNodeId: string; toRoadmapNodeId: string; edgeType?: string }> } })
      ?.careerRoadmapWithNodes?.edges ?? [];
  const graphNodes: RoadmapGraphNode[] = useMemo(() => {
    const depthById = getNodeDepths(roadmapNodes);
    return roadmapNodes.map((roadmapNode) => ({
      id: roadmapNode.id,
      nodeId: roadmapNode.nodeId,
      parentRoadmapNodeId: roadmapNode.parentRoadmapNodeId,
      name: roadmapNode.node.name,
      description: roadmapNode.node.description,
      order: roadmapNode.order,
      nodeType: roadmapNode.nodeType,
      requirementType: roadmapNode.requirementType,
      positionX: roadmapNode.positionX,
      positionY: roadmapNode.positionY,
      status: getTemplatePreviewStatus(depthById.get(roadmapNode.id) ?? 0),
    }));
  }, [roadmapNodes]);
  const levelCount = useMemo(() => {
    if (roadmapNodes.length === 0) return 0;
    return Math.max(...Array.from(getNodeDepths(roadmapNodes).values())) + 1;
  }, [roadmapNodes]);

  const roadmapNodeIdSet = new Set(roadmapNodes.map((n) => n.id));
  const rootRoadmapNodes = roadmapNodes.filter((n) => !n.parentRoadmapNodeId || !roadmapNodeIdSet.has(n.parentRoadmapNodeId));

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });
  const roleFilterOptions = [
    { value: 'All', label: 'All career roles' },
    ...roles.map((role) => ({ value: role.id, label: role.name })),
  ];

  const updateExpandedRoadmapNodes = (roadmapId: string, updater: (nodes: RoadmapNodeDto[]) => RoadmapNodeDto[]) => {
    apolloClient.cache.updateQuery<{ careerRoadmapWithNodes?: { nodes: RoadmapNodeDto[] } }>(
      { query: GET_CAREER_ROADMAP_WITH_NODES, variables: { roadmapId } },
      (current) => current?.careerRoadmapWithNodes
        ? {
            careerRoadmapWithNodes: {
              ...current.careerRoadmapWithNodes,
              nodes: updater(current.careerRoadmapWithNodes.nodes ?? []),
            },
          }
        : current,
    );
  };

  const createMutation = useMutation({
    mutationFn: (dto: RoadmapDto) => apiClient.post<CareerRoadmap>('/api/career-roadmaps', dto).then((r) => r.data),
    onSuccess: (roadmap) => {
      queryClient.setQueryData<CareerRoadmap[]>(['admin-career-roadmaps'], (old) => [roadmap, ...(old ?? [])]);
      setShowForm(false);
      setEditingRoadmap(roadmap);
      setPreviewRoadmap(roadmap);
      loadRoadmapNodes({ variables: { roadmapId: roadmap.id } });
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RoadmapDto }) => apiClient.put<CareerRoadmap>(`/api/career-roadmaps/${id}`, dto).then((r) => r.data),
    onSuccess: (roadmap) => {
      queryClient.setQueryData<CareerRoadmap[]>(['admin-career-roadmaps'], (old) =>
        (old ?? []).map((item) => (item.id === roadmap.id ? roadmap : item)),
      );
      setEditingRoadmap(roadmap);
      setPreviewRoadmap((current) => current?.id === roadmap.id ? roadmap : current);
      setForm({ name: roadmap.name, description: roadmap.description, careerRoleId: roadmap.careerRoleId });
      setShowForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/career-roadmaps/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<CareerRoadmap[]>(['admin-career-roadmaps'], (old) => (old ?? []).filter((item) => item.id !== id));
      setDeleteId(null);
      if (previewRoadmap?.id === id) {
        setPreviewRoadmap(null);
        setSelectedRoadmapNode(null);
      }
    },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const assignNodeMutation = useMutation({
    mutationFn: ({ roadmapId, dto }: { roadmapId: string; dto: CreateRoadmapNodeDto }) =>
      apiClient.post<RoadmapNodeDto>(`/api/career-roadmaps/${roadmapId}/roadmap-nodes`, dto).then((r) => r.data),
    onSuccess: (roadmapNode, { roadmapId }) => {
      updateExpandedRoadmapNodes(roadmapId, (nodes) => [...nodes, roadmapNode]);
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
    onSuccess: (_data, { roadmapId, roadmapNodeId }) => {
      updateExpandedRoadmapNodes(roadmapId, (nodes) => nodes.filter((node) => node.id !== roadmapNodeId));
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove node.'),
  });

  const handleOpenDetail = (rm: CareerRoadmap) => {
    setPreviewRoadmap(rm);
    setEditingRoadmap(rm);
    setShowForm(false);
    setForm({ name: rm.name, description: rm.description, careerRoleId: rm.careerRoleId });
    setSelectedRoadmapNode(null);
    setRoadmapNodeForm({
      nodeId: '',
      parentRoadmapNodeId: undefined,
      order: 1,
      nodeType: 'Topic',
      requirementType: 'Required',
      positionXText: '',
      positionYText: '',
    });
    loadRoadmapNodes({ variables: { roadmapId: rm.id } });
  };

  const handleOpenCreate = () => {
    setPreviewRoadmap(null);
    setEditingRoadmap(null);
    setShowForm(true);
    setSelectedRoadmapNode(null);
    setForm({ name: '', description: '', careerRoleId: selectedRoleId === 'All' ? '' : selectedRoleId });
    setRoadmapNodeForm({
      nodeId: '',
      parentRoadmapNodeId: undefined,
      order: 1,
      nodeType: 'Topic',
      requirementType: 'Required',
      positionXText: '',
      positionYText: '',
    });
  };

  const handleCloseDetail = () => {
    setPreviewRoadmap(null);
    setEditingRoadmap(null);
    setShowForm(false);
    setSelectedRoadmapNode(null);
  };

  const handleSave = () => {
    if (editingRoadmap) updateMutation.mutate({ id: editingRoadmap.id, dto: form });
    else createMutation.mutate(form);
  };

  const isDetailOpen = showForm || previewRoadmap !== null;
  const activeRoadmap = previewRoadmap;
  const detailTitle = activeRoadmap?.name || (editingRoadmap ? editingRoadmap.name : 'Create Template');
  const detailDescription = activeRoadmap?.description || form.description;

  return (
    <AppShell breadcrumb="Admin / Roadmap Templates">
      <div className="app-page admin-page">
        <PageHeader
          title="Roadmap Templates"
          description="Manage career roadmap templates and their node assignments."
          actions={<AdminActionButton icon={Plus} label="Create Template" onClick={handleOpenCreate} />}
        />

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={MapIcon} title="Failed to load templates" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <div className="admin-panel admin-table-card">
            <div className="p-4">
              <AdminListToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search templates by name, description, or career role"
                sortKey={sortKey}
                onSortKeyChange={setSortKey}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                sortOptions={roadmapSortOptions}
              >
                <AdminFilterSelect
                  value={selectedRoleId}
                  onChange={(value) => { setSelectedRoleId(value); setPreviewRoadmap(null); setSelectedRoadmapNode(null); }}
                  options={roleFilterOptions}
                  ariaLabel="Filter templates by career role"
                  className="min-w-48"
                />
              </AdminListToolbar>
            </div>
            <table className="w-full">
              <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase w-8"></th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Name</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Career Role</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Description</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Created</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmapList.pagedItems.map((rm) => (
                    <tr key={rm.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(rm)}
                          className="p-1 rounded hover:bg-[var(--md3-primary-container)] transition-colors"
                          title="View template details"
                        >
                          <Eye className="w-4 h-4 text-[var(--md3-primary)]" />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{rm.name}</td>
                      <td className="px-4 py-4 text-sm text-[var(--md3-on-surface-variant)]">{roles.find((role) => role.id === rm.careerRoleId)?.name ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-[var(--md3-on-surface-variant)]">{rm.description ?? '—'}</td>
                      <td className="px-4 py-4 text-xs text-[var(--md3-on-surface-variant)]">{new Date(rm.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenDetail(rm)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]"><Eye className="w-4 h-4" />Detail</button>
                          <button onClick={() => setDeleteId(rm.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination {...roadmapList} onPageChange={roadmapList.setPage} />
          </div>
        )}

        <AdminDetailDialog
          isOpen={isDetailOpen}
          title={detailTitle}
          description={detailDescription}
          eyebrow={activeRoadmap ? 'Roadmap Template' : 'New Template'}
          icon={GitBranch}
          badge={
            activeRoadmap?.careerRoleId || form.careerRoleId
              ? roles.find((role) => role.id === (activeRoadmap?.careerRoleId ?? form.careerRoleId))?.name ?? 'Career role'
              : undefined
          }
          onClose={handleCloseDetail}
          closeLabel="Close roadmap detail"
          asideHeader={
            <>
              <h3 className="text-base font-semibold text-[var(--md3-on-surface)]">
                {selectedRoadmapNode?.node.name ?? (activeRoadmap ? 'Template Detail' : 'Create Template')}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">
                  <Network className="h-3.5 w-3.5" />
                  {activeRoadmap ? roadmapNodes.length : 0} nodes
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                  <Hash className="h-3.5 w-3.5" />
                  {activeRoadmap ? rootRoadmapNodes.length : 0} roots
                </span>
                {selectedRoadmapNode?.requirementType && (
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                    {selectedRoadmapNode.requirementType}
                  </span>
                )}
              </div>
              {selectedRoadmapNode?.node.description && (
                <p className="mt-4 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
                  {selectedRoadmapNode.node.description}
                </p>
              )}
            </>
          }
          aside={
            <div className="flex-1 space-y-4 overflow-y-auto p-5">

                <AdminInspectorSection
                  title="Template Details"
                  meta={activeRoadmap && (
                    <span className="text-xs text-[var(--md3-on-surface-variant)]">
                      Created {new Date(activeRoadmap.createdAt).toLocaleDateString()}
                    </span>
                  )}
                >
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Template name"
                        className="md3-field h-11 w-full px-3 text-sm"
                      />
                      <textarea
                        value={form.description ?? ''}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                        placeholder="Description"
                        className="md3-field min-h-24 w-full px-3 py-3 text-sm"
                      />
                      <select
                        value={form.careerRoleId}
                        onChange={(event) => setForm({ ...form, careerRoleId: event.target.value })}
                        className="md3-field h-11 w-full px-3 text-sm"
                      >
                        <option value="">Select Career Role</option>
                        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                      </select>
                      <AdminActionButton
                        icon={Save}
                        label={createMutation.isPending || updateMutation.isPending ? 'Saving...' : activeRoadmap ? 'Update Template' : 'Create Template'}
                        onClick={handleSave}
                        disabled={!form.name.trim() || !form.careerRoleId || createMutation.isPending || updateMutation.isPending}
                        className="w-full"
                      />
                    </div>
                </AdminInspectorSection>

                <AdminInspectorSection
                  title="Assigned Nodes"
                  meta={<span className="text-xs text-[var(--md3-on-surface-variant)]">{activeRoadmap ? roadmapNodes.length : 0} total</span>}
                >
                    {!activeRoadmap ? (
                      <p className="text-sm text-[var(--md3-on-surface-variant)]">Create the template before assigning nodes.</p>
                    ) : nodesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                      </div>
                    ) : roadmapNodes.length === 0 ? (
                      <p className="text-sm text-[var(--md3-on-surface-variant)]">No nodes assigned yet.</p>
                    ) : (
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {roadmapNodes.map((roadmapNode) => (
                          <div
                            key={roadmapNode.id}
                            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                              selectedRoadmapNode?.id === roadmapNode.id
                                ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)]'
                                : 'border-[var(--md3-outline-variant)] bg-white'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedRoadmapNode(roadmapNode)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="truncate text-sm font-medium text-[var(--md3-on-surface)]">{roadmapNode.node.name}</p>
                              <p className="text-xs text-[var(--md3-on-surface-variant)]">Order {roadmapNode.order} - {roadmapNode.nodeType}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => activeRoadmap && removeNodeMutation.mutate({ roadmapId: activeRoadmap.id, roadmapNodeId: roadmapNode.id })}
                              disabled={removeNodeMutation.isPending}
                              className="shrink-0 rounded-md p-1.5 text-[var(--md3-error)] hover:bg-[var(--md3-error-container)]"
                              aria-label="Remove node"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </AdminInspectorSection>

                <AdminInspectorSection title="Assign Roadmap Node">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={roadmapNodeForm.nodeId}
                        onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, nodeId: event.target.value })}
                        placeholder="Content node ID"
                        className="md3-field h-10 w-full px-3 text-sm"
                      />
                      <select
                        value={roadmapNodeForm.parentRoadmapNodeId ?? ''}
                        onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, parentRoadmapNodeId: event.target.value || undefined })}
                        className="md3-field h-10 w-full px-3 text-sm"
                      >
                        <option value="">Root node</option>
                        {(activeRoadmap ? roadmapNodes : []).map((roadmapNode) => (
                          <option key={roadmapNode.id} value={roadmapNode.id}>{roadmapNode.node.name}</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={roadmapNodeForm.order}
                          onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, order: Number(event.target.value) })}
                          placeholder="Order"
                          className="md3-field h-10 px-3 text-sm"
                        />
                        <input
                          type="number"
                          value={roadmapNodeForm.positionXText}
                          onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, positionXText: event.target.value })}
                          placeholder="X"
                          className="md3-field h-10 px-3 text-sm"
                        />
                        <input
                          type="number"
                          value={roadmapNodeForm.positionYText}
                          onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, positionYText: event.target.value })}
                          placeholder="Y"
                          className="md3-field h-10 px-3 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={roadmapNodeForm.nodeType}
                          onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, nodeType: event.target.value })}
                          className="md3-field h-10 px-3 text-sm"
                        >
                          <option value="Topic">Topic</option>
                          <option value="Group">Group</option>
                          <option value="Milestone">Milestone</option>
                        </select>
                        <select
                          value={roadmapNodeForm.requirementType}
                          onChange={(event) => setRoadmapNodeForm({ ...roadmapNodeForm, requirementType: event.target.value })}
                          className="md3-field h-10 px-3 text-sm"
                        >
                          <option value="Required">Required</option>
                          <option value="Recommended">Recommended</option>
                          <option value="Optional">Optional</option>
                        </select>
                      </div>
                      <AdminActionButton
                        icon={Plus}
                        label={assignNodeMutation.isPending ? 'Adding...' : 'Assign Node'}
                        onClick={() => {
                          if (!roadmapNodeForm.nodeId.trim()) return;
                          if (!activeRoadmap) return;
                          assignNodeMutation.mutate({
                            roadmapId: activeRoadmap.id,
                            dto: {
                              nodeId: roadmapNodeForm.nodeId.trim(),
                              parentRoadmapNodeId: roadmapNodeForm.parentRoadmapNodeId,
                              order: roadmapNodeForm.order,
                              nodeType: roadmapNodeForm.nodeType,
                              requirementType: roadmapNodeForm.requirementType,
                              positionX: roadmapNodeForm.positionXText ? Number(roadmapNodeForm.positionXText) : undefined,
                              positionY: roadmapNodeForm.positionYText ? Number(roadmapNodeForm.positionYText) : undefined,
                            },
                          });
                        }}
                        disabled={!activeRoadmap || !roadmapNodeForm.nodeId.trim() || assignNodeMutation.isPending}
                        className="mt-2 w-full"
                      />
                    </div>
                </AdminInspectorSection>
            </div>
          }
        >
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <RoadmapCanvasHeader
              title={detailTitle}
              description={detailDescription}
              nodeCount={graphNodes.length}
              levelCount={levelCount}
            />
            {!activeRoadmap ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={Network}
                  title="Save template details first"
                  description="After the template is created, the visual roadmap and node assignment tools will be available here."
                />
              </div>
            ) : nodesLoading ? (
              <div className="p-6">
                <Skeleton className="h-[520px] rounded-xl" />
              </div>
            ) : graphNodes.length > 0 ? (
              <RoadmapGraphCanvas
                graphNodes={graphNodes}
                graphEdges={roadmapEdges}
                selectedNodeId={selectedRoadmapNode?.id}
                onNodeSelect={(node) => {
                  setSelectedRoadmapNode(roadmapNodes.find((item) => item.id === node.id) ?? null);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={Network}
                  title="No nodes assigned"
                  description="Assign content nodes from the inspector to build this roadmap template."
                />
              </div>
            )}
          </div>
        </AdminDetailDialog>

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Template?" message="This will permanently remove the roadmap template." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
