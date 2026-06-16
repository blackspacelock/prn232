import { useEffect, useMemo, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { AdminField, AdminFormDialog } from '../../components/admin/AdminFormDialog';
import { AdminRecordCard } from '../../components/admin/AdminRecordCard';
import { BookOpen, ChevronRight, ExternalLink, FolderTree, Hash, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { appendCachedListItem, removeCachedListItem, replaceCachedListItem } from '@/lib/apolloCache';
import { GET_LEARNING_RESOURCES_BY_NODE, GET_NODE_CHILDREN, GET_ROOT_NODES } from '@/graphql/queries';

interface NodeItem {
  id: string;
  name: string;
  description?: string;
  parentNodeId?: string | null;
  order: number;
  createdAt?: string;
}

interface NodeForm {
  name: string;
  description?: string;
  parentNodeId?: string | null;
  order: number;
}

interface LearningResource {
  id: string;
  nodeId: string;
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider?: string | null;
  isFree: boolean;
  createdAt: string;
}

interface ResourceForm {
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider?: string;
  isFree: boolean;
}

type NodeSortKey = 'name' | 'order' | 'createdAt';

const nodeSortOptions = [
  { value: 'order', label: 'Order' },
  { value: 'name', label: 'Node name' },
  { value: 'createdAt', label: 'Created date' },
] satisfies Array<{ value: NodeSortKey; label: string }>;

const resourceTypes = ['Course', 'Documentation', 'Article', 'Video', 'Book', 'Practice', 'Tool'];
const emptyResourceForm: ResourceForm = { name: '', resourceUrl: '', resourceType: resourceTypes[0], provider: '', isFree: true };

export function AdminNodeLibraryPage() {
  const [currentParent, setCurrentParent] = useState<NodeItem | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<NodeItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);
  const [form, setForm] = useState<NodeForm>({ name: '', description: '', parentNodeId: null, order: 1 });
  const [resourceForm, setResourceForm] = useState<ResourceForm>(emptyResourceForm);
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
  const [resourceDeleteId, setResourceDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<NodeSortKey>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const rootQuery = useQuery(GET_ROOT_NODES);
  const [loadChildren, childrenQuery] = useLazyQuery(GET_NODE_CHILDREN);
  const resourcesQuery = useQuery(GET_LEARNING_RESOURCES_BY_NODE, {
    variables: { nodeId: editingNode?.id ?? '' },
    skip: !editingNode,
  });

  useEffect(() => {
    if (currentParent) loadChildren({ variables: { parentId: currentParent.id } });
  }, [currentParent, loadChildren]);

  const nodes: NodeItem[] = useMemo(
    () => currentParent
      ? (childrenQuery.data as { nodeChildren?: NodeItem[] } | undefined)?.nodeChildren ?? []
      : (rootQuery.data as { rootNodes?: NodeItem[] } | undefined)?.rootNodes ?? [],
    [childrenQuery.data, currentParent, rootQuery.data],
  );

  const isLoading = currentParent ? childrenQuery.loading : rootQuery.loading;
  const queryError = currentParent ? childrenQuery.error : rootQuery.error;
  const activeQueryOptions = currentParent
    ? { query: GET_NODE_CHILDREN, variables: { parentId: currentParent.id } }
    : { query: GET_ROOT_NODES };
  const activeFieldName = currentParent ? 'nodeChildren' : 'rootNodes';
  const nodeResourceQueryOptions = editingNode
    ? { query: GET_LEARNING_RESOURCES_BY_NODE, variables: { nodeId: editingNode.id } }
    : null;
  const resources: LearningResource[] = (resourcesQuery.data as { learningResourcesByNode?: LearningResource[] } | undefined)?.learningResourcesByNode ?? [];

  const nodeList = useAdminList({
    items: nodes,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (node, term) => `${node.name} ${node.description ?? ''} ${node.id}`.toLowerCase().includes(term),
    getSortValue: (node, key) => {
      if (key === 'createdAt') return node.createdAt ? new Date(node.createdAt) : null;
      return node[key];
    },
  });

  const nextOrder = useMemo(() => {
    const highest = nodes.reduce((max, node) => Math.max(max, node.order), 0);
    return highest + 1;
  }, [nodes]);

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const createMutation = useMutation({
    mutationFn: (dto: NodeForm) => apiClient.post<NodeItem>('/api/nodes', dto).then((r) => r.data),
    onSuccess: (node) => {
      appendCachedListItem<NodeItem>(activeQueryOptions, activeFieldName, node);
      setShowForm(false);
      setForm({ name: '', description: '', parentNodeId: currentParent?.id ?? null, order: nextOrder + 1 });
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create node.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: NodeForm }) => apiClient.put<NodeItem>(`/api/nodes/${id}`, dto).then((r) => r.data),
    onSuccess: (node) => {
      replaceCachedListItem<NodeItem>(activeQueryOptions, activeFieldName, node);
      setEditingNode(null);
      setShowForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update node.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/nodes/${id}`),
    onSuccess: (_data, id) => {
      removeCachedListItem<NodeItem>(activeQueryOptions, activeFieldName, id);
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete node.');
      setDeleteId(null);
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: ({ nodeId, dto }: { nodeId: string; dto: ResourceForm }) => apiClient.post<LearningResource>(`/api/nodes/${nodeId}/learning-resources`, dto).then((r) => r.data),
    onSuccess: (resource) => {
      if (nodeResourceQueryOptions) appendCachedListItem<LearningResource>(nodeResourceQueryOptions, 'learningResourcesByNode', resource);
      setResourceForm(emptyResourceForm);
      setEditingResource(null);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to create learning resource.'),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ResourceForm }) => apiClient.put<LearningResource>(`/api/learning-resources/${id}`, dto).then((r) => r.data),
    onSuccess: (resource) => {
      if (nodeResourceQueryOptions) replaceCachedListItem<LearningResource>(nodeResourceQueryOptions, 'learningResourcesByNode', resource);
      setResourceForm(emptyResourceForm);
      setEditingResource(null);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to update learning resource.'),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/learning-resources/${id}`),
    onSuccess: (_data, id) => {
      if (nodeResourceQueryOptions) removeCachedListItem<LearningResource>(nodeResourceQueryOptions, 'learningResourcesByNode', id);
      setResourceDeleteId(null);
    },
    onError: (e: unknown) => {
      showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to delete learning resource.');
      setResourceDeleteId(null);
    },
  });

  const openCreateForm = () => {
    setEditingNode(null);
    setForm({ name: '', description: '', parentNodeId: currentParent?.id ?? null, order: nextOrder });
    setEditingResource(null);
    setResourceForm(emptyResourceForm);
    setShowForm(true);
  };

  const openEditForm = (node: NodeItem) => {
    setEditingNode(node);
    setForm({ name: node.name, description: node.description ?? '', parentNodeId: node.parentNodeId ?? null, order: node.order });
    setEditingResource(null);
    setResourceForm(emptyResourceForm);
    setShowForm(true);
  };

  const handleSave = () => {
    const dto = {
      ...form,
      description: form.description?.trim() || undefined,
      parentNodeId: form.parentNodeId || null,
    };
    if (editingNode) updateMutation.mutate({ id: editingNode.id, dto });
    else createMutation.mutate(dto);
  };

  const editResource = (resource: LearningResource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      resourceUrl: resource.resourceUrl,
      resourceType: resource.resourceType,
      provider: resource.provider ?? '',
      isFree: resource.isFree,
    });
  };

  const saveResource = () => {
    if (!editingNode) return;
    const dto = {
      ...resourceForm,
      name: resourceForm.name.trim(),
      resourceUrl: resourceForm.resourceUrl.trim(),
      resourceType: resourceForm.resourceType.trim(),
      provider: resourceForm.provider?.trim() || undefined,
    };
    if (editingResource) updateResourceMutation.mutate({ id: editingResource.id, dto });
    else createResourceMutation.mutate({ nodeId: editingNode.id, dto });
  };

  const openChildren = (node: NodeItem) => {
    setCurrentParent(node);
    setBreadcrumb((items) => [...items, node]);
    setSearch('');
  };

  const jumpToCrumb = (index: number) => {
    const nextBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(nextBreadcrumb);
    setCurrentParent(nextBreadcrumb.at(-1) ?? null);
    setSearch('');
  };

  const showRoots = () => {
    setCurrentParent(null);
    setBreadcrumb([]);
    setSearch('');
  };

  const reload = () => {
    if (currentParent) childrenQuery.refetch?.({ parentId: currentParent.id });
    else rootQuery.refetch();
  };

  return (
    <AppShell breadcrumb="Admin / Node Library">
      <div className="app-page admin-page">
        <PageHeader
          title="Node Library"
          description="Manage reusable learning nodes and browse their hierarchy."
          actions={<AdminActionButton icon={Plus} label={currentParent ? 'Create Child Node' : 'Create Root Node'} onClick={openCreateForm} />}
        />

        <AdminFormDialog
          isOpen={showForm}
          title={editingNode ? 'Edit Node' : currentParent ? 'Create Child Node' : 'Create Root Node'}
          description={currentParent ? `Parent: ${currentParent.name}` : 'Root nodes start a new reusable learning branch.'}
          submitLabel="Save Node"
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitDisabled={!form.name.trim()}
          onSubmit={handleSave}
          onCancel={() => { setShowForm(false); setEditingNode(null); setEditingResource(null); }}
        >
          <div className="space-y-3">
            <AdminField label="Node name" description="Name the learning topic as it should appear in catalogs and roadmaps." required>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Node name" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Description" description="Optional learner-facing summary explaining what this node covers.">
              <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="md3-field min-h-24 w-full px-4 py-3" />
            </AdminField>
            <AdminField label="Order" description="Controls this node's position within the current branch." required>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="md3-field w-full px-4" min={1} />
            </AdminField>

            {editingNode && (
              <section className="mt-5 border-t border-[var(--md3-outline-variant)] pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--md3-on-surface)]">Learning Resources</h3>
                    <p className="text-xs leading-5 text-[var(--md3-on-surface-variant)]">Add, edit, or remove resources attached to this node.</p>
                  </div>
                  {editingResource && (
                    <button type="button" onClick={() => { setEditingResource(null); setResourceForm(emptyResourceForm); }} className="rounded-md px-3 py-2 text-xs font-medium text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]">New Resource</button>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-[var(--md3-outline-variant)] p-3">
                  <AdminField label="Resource name" description="Learner-facing title for this resource." required>
                    <input type="text" value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} placeholder="Resource name" className="md3-field w-full px-4" />
                  </AdminField>
                  <AdminField label="Resource URL" description="Full link learners should open, including https://." required>
                    <input type="url" value={resourceForm.resourceUrl} onChange={(e) => setResourceForm({ ...resourceForm, resourceUrl: e.target.value })} placeholder="https://..." className="md3-field w-full px-4" />
                  </AdminField>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminField label="Type" description="Format category for this resource." required>
                      <input type="text" value={resourceForm.resourceType} onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value })} list="node-resource-types" className="md3-field w-full px-4" />
                    </AdminField>
                    <AdminField label="Provider" description="Optional source name.">
                      <input type="text" value={resourceForm.provider ?? ''} onChange={(e) => setResourceForm({ ...resourceForm, provider: e.target.value })} placeholder="Provider" className="md3-field w-full px-4" />
                    </AdminField>
                  </div>
                  <datalist id="node-resource-types">
                    {resourceTypes.map((type) => <option key={type} value={type} />)}
                  </datalist>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-3 text-sm text-[var(--md3-on-surface)]">
                      <input type="checkbox" checked={resourceForm.isFree} onChange={(e) => setResourceForm({ ...resourceForm, isFree: e.target.checked })} className="h-4 w-4" />
                      Free resource
                    </label>
                    <AdminActionButton
                      icon={Plus}
                      label={editingResource ? 'Update Resource' : 'Add Resource'}
                      onClick={saveResource}
                      disabled={!resourceForm.name.trim() || !resourceForm.resourceUrl.trim() || !resourceForm.resourceType.trim() || createResourceMutation.isPending || updateResourceMutation.isPending}
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {resourcesQuery.loading ? (
                    <Skeleton className="h-16 rounded-lg" />
                  ) : resources.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--md3-outline-variant)] p-4 text-center text-sm text-[var(--md3-on-surface-variant)]">
                      <BookOpen className="mx-auto mb-2 h-5 w-5" />
                      No resources attached yet.
                    </div>
                  ) : (
                    resources.map((resource) => (
                      <div key={resource.id} className="rounded-lg border border-[var(--md3-outline-variant)] px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{resource.name}</p>
                            <p className="mt-1 text-xs text-[var(--md3-on-surface-variant)]">
                              {resource.resourceType} - {resource.provider ?? 'No provider'} - {resource.isFree ? 'Free' : 'Paid'} - <a href={resource.resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--md3-primary)] hover:underline">Open <ExternalLink className="h-3 w-3" /></a>
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button type="button" onClick={() => editResource(resource)} className="rounded-md p-2 hover:bg-[var(--md3-primary-container)]" aria-label={`Edit ${resource.name}`}><Pencil className="h-4 w-4 text-[var(--md3-primary)]" /></button>
                            <button type="button" onClick={() => setResourceDeleteId(resource.id)} className="rounded-md p-2 hover:bg-[var(--md3-error-container)]" aria-label={`Delete ${resource.name}`}><Trash2 className="h-4 w-4 text-[var(--md3-error)]" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        </AdminFormDialog>

        <div className="admin-panel p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--md3-on-surface)]">Current branch</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--md3-on-surface-variant)]">
                <button type="button" onClick={showRoots} className="rounded-md px-2 py-1 font-medium text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]">Root nodes</button>
                {breadcrumb.map((node, index) => (
                  <span key={node.id} className="inline-flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <button type="button" onClick={() => jumpToCrumb(index)} className="max-w-48 truncate rounded-md px-2 py-1 font-medium text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]">{node.name}</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-surface-container)] px-2 py-1 text-xs text-[var(--md3-on-surface-variant)]">
                <Hash className="h-3.5 w-3.5" />
                {nodes.length} nodes
              </span>
              <AdminActionButton icon={RefreshCw} label={isLoading ? 'Refreshing...' : 'Refresh'} onClick={reload} disabled={isLoading} />
            </div>
          </div>
        </div>

        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={currentParent ? 'Search child nodes...' : 'Search root nodes...'}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={nodeSortOptions}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : queryError ? (
          <EmptyState icon={FolderTree} title="Failed to load nodes" description="Please try again." actionLabel="Retry" onAction={reload} />
        ) : nodeList.totalItems === 0 ? (
          <EmptyState icon={FolderTree} title="No nodes found" description={search ? 'No nodes match the current search.' : 'Create the first node in this branch.'} actionLabel="Create Node" onAction={openCreateForm} />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3">
              {nodeList.pagedItems.map((node) => (
                <AdminRecordCard
                  key={node.id}
                  eyebrow={
                    <>
                      <span className="rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">Order {node.order}</span>
                      <span className="truncate text-xs text-[var(--md3-on-surface-variant)]">{node.id}</span>
                    </>
                  }
                  title={node.name}
                  description={<p className="line-clamp-2">{node.description ?? 'No description.'}</p>}
                  actions={
                    <>
                      <button type="button" onClick={() => openChildren(node)} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]">Children</button>
                      <button type="button" onClick={() => openEditForm(node)} className="rounded-md p-2 hover:bg-[var(--md3-primary-container)]" aria-label={`Edit ${node.name}`}><Pencil className="h-4 w-4 text-[var(--md3-primary)]" /></button>
                      <button type="button" onClick={() => setDeleteId(node.id)} className="rounded-md p-2 hover:bg-[var(--md3-error-container)]" aria-label={`Delete ${node.name}`}><Trash2 className="h-4 w-4 text-[var(--md3-error)]" /></button>
                    </>
                  }
                />
              ))}
            </div>
            <div className="admin-panel">
              <AdminPagination {...nodeList} onPageChange={nodeList.setPage} />
            </div>
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Node?" message="This will permanently remove the node and any dependent data allowed by the API." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <ConfirmDialog isOpen={resourceDeleteId !== null} title="Delete Learning Resource?" message="This will permanently remove the resource from this node." confirmLabel="Delete" variant="danger" onConfirm={() => { if (resourceDeleteId) deleteResourceMutation.mutate(resourceDeleteId); }} onCancel={() => setResourceDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
