import { useMemo, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2, Network, ChevronRight, Hash, Search } from 'lucide-react';
import { useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { GET_NODE_CHILDREN, GET_NODE_HIERARCHY } from '@/graphql/queries';

interface NodeItem { id: string; name: string; description?: string; parentNodeId?: string; order: number }
interface NodeDto { name: string; description?: string; parentNodeId?: string; order: number }

export function AdminNodeLibraryPage() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);
  const [form, setForm] = useState<NodeDto>({ name: '', order: 1 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [rootId, setRootId] = useState('');
  const [search, setSearch] = useState('');

  const [loadChildren, { data: childrenData, loading, error }] = useLazyQuery(GET_NODE_CHILDREN);
  const [loadHierarchy, { data: hierarchyData, loading: hierarchyLoading, }] = useLazyQuery(GET_NODE_HIERARCHY);

  const nodes: NodeItem[] = (childrenData as { nodeChildren?: NodeItem[] })?.nodeChildren ?? [];
  const filteredNodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return nodes;
    return nodes.filter((node) =>
      `${node.name} ${node.description ?? ''}`.toLowerCase().includes(term),
    );
  }, [nodes, search]);
  const hierarchyRootName =
    (hierarchyData as { nodeHierarchy?: { name?: string } } | undefined)?.nodeHierarchy?.name;

  const invalidate = () => apolloClient.refetchQueries({ include: [GET_NODE_CHILDREN] });
  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const createMutation = useMutation({
    mutationFn: (dto: NodeDto) => apiClient.post('/api/nodes', dto),
    onSuccess: async () => { await invalidate(); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: NodeDto }) => apiClient.put(`/api/nodes/${id}`, dto),
    onSuccess: async () => { await invalidate(); setEditingNode(null); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/nodes/${id}`),
    onSuccess: async () => { await invalidate(); setDeleteId(null); },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const handleLoadChildren = (id: string) => {
    setParentId(id);
    loadChildren({ variables: { parentId: id } });
  };

  const handleLoadHierarchy = () => {
    if (rootId) loadHierarchy({ variables: { rootId } });
  };

  const handleSave = () => {
    const dto = { ...form, parentNodeId: parentId ?? undefined };
    if (editingNode) updateMutation.mutate({ id: editingNode.id, dto });
    else createMutation.mutate(dto);
  };

  return (
    <AppShell breadcrumb="Admin / Node Library">
      <div className="app-page">
        <PageHeader
          title="Node Library"
          description="Manage learning nodes and their hierarchical structure."
          actions={<AdminActionButton icon={Plus} label="Create Node" onClick={() => { setEditingNode(null); setForm({ name: '', order: 1 }); setShowForm(true); }} />}
        />

        <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--md3-on-surface)]">Browse Hierarchy</p>
            {parentId && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-surface-container)] px-2 py-1 text-xs text-[var(--md3-on-surface-variant)]">
                <Hash className="h-3.5 w-3.5" />
                {nodes.length} children
              </span>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input type="text" value={rootId} onChange={(e) => setRootId(e.target.value)} placeholder="Root node UUID" className="md3-field h-11 px-4" />
            <AdminActionButton icon={Network} label={hierarchyLoading ? 'Loading...' : 'Load Hierarchy'} onClick={handleLoadHierarchy} disabled={!rootId || hierarchyLoading} />
            <AdminActionButton icon={ChevronRight} label="Reload Children" onClick={() => { if (parentId) loadChildren({ variables: { parentId } }); }} disabled={!parentId} />
          </div>
        </div>

        {showForm && (
          <div className="md3-card p-6">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">{editingNode ? 'Edit Node' : 'Create Node'}</h3>
            <div className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Node name" className="md3-field w-full px-4" />
              <input type="text" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="md3-field w-full px-4" />
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="md3-field w-full px-4" min={1} />
              <div className="flex gap-3">
                <AdminActionButton icon={Plus} label={createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'} onClick={handleSave} disabled={!form.name || createMutation.isPending || updateMutation.isPending} />
                <AdminActionButton icon={Trash2} label="Cancel" onClick={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

        {hierarchyRootName && (
          <div className="md3-card p-4 mb-4 text-sm text-[var(--md3-on-surface-variant)]">
            Hierarchy root: <strong>{hierarchyRootName}</strong> - use &quot;Load Children&quot; to browse sub-nodes.
          </div>
        )}

        {!parentId ? (
          <EmptyState icon={Network} title="Browse the node library" description="Enter a root node ID above and click Load Hierarchy or Load Children." actionLabel="" onAction={() => {}} />
        ) : loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={Network} title="Failed to load nodes" description="Please try again." actionLabel="Retry" onAction={() => loadChildren({ variables: { parentId } })} />
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search loaded nodes"
                className="h-11 w-full rounded-md border border-[var(--md3-outline)] bg-white pl-10 pr-4 text-sm focus:border-[var(--md3-primary)] focus:outline-none"
              />
            </div>
            <div className="grid gap-3">
              {filteredNodes.map((node) => (
                <div key={node.id} className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">Order {node.order}</span>
                        <span className="truncate text-xs text-[var(--md3-on-surface-variant)]">{node.id}</span>
                      </div>
                      <h3 className="text-base font-semibold text-[var(--md3-on-surface)]">{node.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--md3-on-surface-variant)]">{node.description ?? 'No description.'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => handleLoadChildren(node.id)} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]">Children</button>
                      <button onClick={() => { setEditingNode(node); setForm({ name: node.name, description: node.description, order: node.order }); setShowForm(true); }} className="rounded-md p-2 hover:bg-[var(--md3-primary-container)]"><Pencil className="h-4 w-4 text-[var(--md3-primary)]" /></button>
                      <button onClick={() => setDeleteId(node.id)} className="rounded-md p-2 hover:bg-[var(--md3-error-container)]"><Trash2 className="h-4 w-4 text-[var(--md3-error)]" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Node?" message="This will permanently remove the node." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
