import { useMemo, useState } from 'react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { AdminField, AdminFormDialog } from '../../components/admin/AdminFormDialog';
import { AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { AdminRecordCard } from '../../components/admin/AdminRecordCard';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';

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
  nodeId: string;
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider?: string;
  isFree: boolean;
}

type ResourceSortKey = 'name' | 'resourceType' | 'provider' | 'nodeId' | 'createdAt';

const resourceSortOptions = [
  { value: 'name', label: 'Resource name' },
  { value: 'resourceType', label: 'Type' },
  { value: 'provider', label: 'Provider' },
  { value: 'nodeId', label: 'Node ID' },
  { value: 'createdAt', label: 'Created date' },
] satisfies Array<{ value: ResourceSortKey; label: string }>;

const resourceTypes = ['Course', 'Documentation', 'Article', 'Video', 'Book', 'Practice', 'Tool'];
const emptyForm: ResourceForm = { nodeId: '', name: '', resourceUrl: '', resourceType: resourceTypes[0], provider: '', isFree: true };

export function AdminLearningResourcesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<ResourceSortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const resourcesQuery = useRestQuery({
    queryKey: ['admin-learning-resources'],
    queryFn: () => apiClient.get<LearningResource[]>('/api/learning-resources').then((r) => r.data),
  });

  const resources = useMemo(() => resourcesQuery.data ?? [], [resourcesQuery.data]);
  const resourceList = useAdminList({
    items: resources,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (resource, term) => `${resource.name} ${resource.resourceType} ${resource.provider ?? ''} ${resource.resourceUrl} ${resource.nodeId}`.toLowerCase().includes(term),
    getSortValue: (resource, key) => {
      if (key === 'createdAt') return new Date(resource.createdAt);
      return resource[key] ?? '';
    },
  });

  const showError = (message: string) => setSnackbar({ open: true, message });

  const createMutation = useMutation({
    mutationFn: (dto: ResourceForm) => {
      const { nodeId, ...payload } = dto;
      return apiClient.post<LearningResource>(`/api/nodes/${nodeId}/learning-resources`, payload).then((r) => r.data);
    },
    onSuccess: (resource) => {
      queryClient.setQueryData<LearningResource[]>(['admin-learning-resources'], (old) => [resource, ...(old ?? [])]);
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to create learning resource.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ResourceForm }) => {
      const { nodeId: _nodeId, ...payload } = dto;
      return apiClient.put<LearningResource>(`/api/learning-resources/${id}`, payload).then((r) => r.data);
    },
    onSuccess: (resource) => {
      queryClient.setQueryData<LearningResource[]>(['admin-learning-resources'], (old) => (old ?? []).map((item) => (item.id === resource.id ? resource : item)));
      setEditingResource(null);
      setShowForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to update learning resource.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/learning-resources/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<LearningResource[]>(['admin-learning-resources'], (old) => (old ?? []).filter((item) => item.id !== id));
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to delete learning resource.');
      setDeleteId(null);
    },
  });

  const openCreateForm = () => {
    setEditingResource(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (resource: LearningResource) => {
    setEditingResource(resource);
    setForm({
      nodeId: resource.nodeId,
      name: resource.name,
      resourceUrl: resource.resourceUrl,
      resourceType: resource.resourceType,
      provider: resource.provider ?? '',
      isFree: resource.isFree,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const dto = {
      ...form,
      nodeId: form.nodeId.trim(),
      name: form.name.trim(),
      resourceUrl: form.resourceUrl.trim(),
      resourceType: form.resourceType.trim(),
      provider: form.provider?.trim() || undefined,
    };
    if (editingResource) updateMutation.mutate({ id: editingResource.id, dto });
    else createMutation.mutate(dto);
  };

  return (
    <AppShell breadcrumb="Admin / Learning Resources">
      <div className="app-page admin-page">
        <PageHeader
          title="Learning Resources"
          description="Manage all courses, documentation, videos, and references attached to learning nodes."
          actions={<AdminActionButton icon={Plus} label="Create Resource" onClick={openCreateForm} />}
        />

        <AdminFormDialog
          isOpen={showForm}
          title={editingResource ? 'Edit Resource' : 'Create Resource'}
          description={editingResource ? 'Update the resource details. Node assignment is shown for reference.' : 'Attach a new resource to an existing node by Node ID.'}
          submitLabel="Save Resource"
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitDisabled={!form.nodeId.trim() || !form.name.trim() || !form.resourceUrl.trim() || !form.resourceType.trim()}
          onSubmit={handleSave}
          onCancel={() => { setShowForm(false); setEditingResource(null); }}
        >
          <div className="space-y-3">
            <AdminField label="Node ID" description={editingResource ? 'Existing node assignment. Move resources from the node editor if reassignment is needed.' : 'Paste the ID of the node this resource belongs to.'} required>
              <input type="text" value={form.nodeId} onChange={(e) => setForm({ ...form, nodeId: e.target.value })} disabled={!!editingResource} placeholder="Node UUID" className="md3-field w-full px-4 disabled:opacity-60" />
            </AdminField>
            <AdminField label="Resource name" description="Use the learner-facing title shown on the roadmap node." required>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Resource name" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Resource URL" description="Paste the full link learners should open, including https://." required>
              <input type="url" value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })} placeholder="https://..." className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Resource type" description="Classify the resource so learners can scan formats quickly." required>
              <input type="text" value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value })} placeholder="Resource type" list="learning-resource-types" className="md3-field w-full px-4" />
            </AdminField>
            <datalist id="learning-resource-types">
              {resourceTypes.map((type) => <option key={type} value={type} />)}
            </datalist>
            <AdminField label="Provider" description="Optional source name such as Coursera, Microsoft Learn, YouTube, or a university.">
              <input type="text" value={form.provider ?? ''} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Provider (optional)" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Access" description="Mark whether learners can use this resource without payment.">
              <span className="flex items-center gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-3 py-3 text-sm text-[var(--md3-on-surface)]">
                <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} className="h-4 w-4" />
                Free resource
              </span>
            </AdminField>
          </div>
        </AdminFormDialog>

        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search resources..."
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={resourceSortOptions}
        />

        {resourcesQuery.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : resourcesQuery.error ? (
          <EmptyState icon={BookOpen} title="Failed to load resources" description="Please try again." actionLabel="Retry" onAction={resourcesQuery.refetch} />
        ) : resourceList.totalItems === 0 ? (
          <EmptyState icon={BookOpen} title="No resources found" description={search ? 'No resources match the current search.' : 'Create the first learning resource.'} actionLabel="Create Resource" onAction={openCreateForm} />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3">
              {resourceList.pagedItems.map((resource) => (
                <AdminRecordCard
                  key={resource.id}
                  eyebrow={
                    <>
                      <span className="rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">{resource.resourceType}</span>
                      <span className="rounded-md bg-[var(--md3-surface-container)] px-2 py-1 text-xs text-[var(--md3-on-surface-variant)]">{resource.isFree ? 'Free' : 'Paid'}</span>
                    </>
                  }
                  title={resource.name}
                  description={<span>{resource.provider ?? 'No provider'} - Node {resource.nodeId} - <a href={resource.resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--md3-primary)] hover:underline">Open <ExternalLink className="h-3 w-3" /></a></span>}
                  actions={
                    <>
                      <button type="button" onClick={() => openEditForm(resource)} className="rounded-md p-2 hover:bg-[var(--md3-primary-container)]" aria-label={`Edit ${resource.name}`}><Pencil className="h-4 w-4 text-[var(--md3-primary)]" /></button>
                      <button type="button" onClick={() => setDeleteId(resource.id)} className="rounded-md p-2 hover:bg-[var(--md3-error-container)]" aria-label={`Delete ${resource.name}`}><Trash2 className="h-4 w-4 text-[var(--md3-error)]" /></button>
                    </>
                  }
                />
              ))}
            </div>
            <div className="admin-panel">
              <AdminPagination {...resourceList} onPageChange={resourceList.setPage} />
            </div>
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Learning Resource?" message="This will permanently remove the resource from its node." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
