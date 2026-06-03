import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2, Network, ChevronRight } from 'lucide-react';
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

  const [loadChildren, { data: childrenData, loading, error }] = useLazyQuery(GET_NODE_CHILDREN);
  const [loadHierarchy, { data: hierarchyData, loading: hierarchyLoading, }] = useLazyQuery(GET_NODE_HIERARCHY);

  const nodes: NodeItem[] = (childrenData as any)?.nodeChildren ?? [];

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

        <div className="md3-card p-4 mb-4">
          <p className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">Browse Hierarchy</p>
          <div className="flex gap-2">
            <input type="text" value={rootId} onChange={(e) => setRootId(e.target.value)} placeholder="Root node UUID" className="md3-field flex-1 px-4 h-10" />
            <AdminActionButton icon={Network} label="Load Hierarchy" onClick={handleLoadHierarchy} disabled={!rootId || hierarchyLoading} />
            <AdminActionButton icon={ChevronRight} label="Load Children" onClick={() => { if (parentId) loadChildren({ variables: { parentId } }); }} disabled={!parentId} />
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

        {(hierarchyData as any) && (
          <div className="md3-card p-4 mb-4 text-sm text-[var(--md3-on-surface-variant)]">
            Hierarchy root: <strong>{(hierarchyData as any)?.nodeHierarchy?.name}</strong> — use &quot;Load Children&quot; to browse sub-nodes.
          </div>
        )}

        {!parentId ? (
          <EmptyState icon={Network} title="Browse the node library" description="Enter a root node ID above and click Load Hierarchy or Load Children." actionLabel="" onAction={() => {}} />
        ) : loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={Network} title="Failed to load nodes" description="Please try again." actionLabel="Retry" onAction={() => loadChildren({ variables: { parentId } })} />
        ) : (
          <div className="md3-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Order</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--md3-on-surface)]">{node.name}</span>
                        <button onClick={() => handleLoadChildren(node.id)} className="text-xs text-[var(--md3-primary)] hover:underline">View children</button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{node.description ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{node.order}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingNode(node); setForm({ name: node.name, description: node.description, order: node.order }); setShowForm(true); }} className="p-2 hover:bg-[var(--md3-primary-container)] rounded-lg"><Pencil className="w-4 h-4 text-[var(--md3-primary)]" /></button>
                        <button onClick={() => setDeleteId(node.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Node?" message="This will permanently remove the node." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
