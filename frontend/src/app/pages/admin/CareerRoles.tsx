import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminListToolbar, AdminPagination, useAdminList } from '../../components/admin/AdminListControls';
import { AdminFormDialog } from '../../components/admin/AdminFormDialog';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { appendCachedListItem, removeCachedListItem, replaceCachedListItem } from '@/lib/apolloCache';
import { GET_CAREER_ROLES } from '@/graphql/queries';

interface CareerRole { id: string; name: string; description?: string; createdAt: string }
interface CareerRoleDto { name: string; description?: string }
type RoleSortKey = 'name' | 'createdAt';
const roleSortOptions = [
  { value: 'name', label: 'Role name' },
  { value: 'createdAt', label: 'Created date' },
] satisfies Array<{ value: RoleSortKey; label: string }>;

export function AdminCareerRolesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<RoleSortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<CareerRole | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CareerRoleDto>({ name: '', description: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { data, loading, error, refetch } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRole[] = (data as { careerRoles?: CareerRole[] })?.careerRoles ?? [];
  const roleList = useAdminList({
    items: roles,
    searchText: searchQuery,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (role, term) => `${role.name} ${role.description ?? ''}`.toLowerCase().includes(term),
    getSortValue: (role, key) => key === 'name' ? role.name : new Date(role.createdAt),
  });

  const rolesQueryOptions = { query: GET_CAREER_ROLES };
  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const createMutation = useMutation({
    mutationFn: (dto: CareerRoleDto) => apiClient.post<CareerRole>('/api/career-roles', dto).then((r) => r.data),
    onSuccess: (role) => { appendCachedListItem<CareerRole>(rolesQueryOptions, 'careerRoles', role); setShowForm(false); setForm({ name: '', description: '' }); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CareerRoleDto }) => apiClient.put<CareerRole>(`/api/career-roles/${id}`, dto).then((r) => r.data),
    onSuccess: (role) => { replaceCachedListItem<CareerRole>(rolesQueryOptions, 'careerRoles', role); setEditingRole(null); setShowForm(false); },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/career-roles/${id}`),
    onSuccess: (_data, id) => { removeCachedListItem<CareerRole>(rolesQueryOptions, 'careerRoles', id); setDeleteId(null); },
    onError: (e: unknown) => { showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); setDeleteId(null); },
  });

  const handleSave = () => {
    if (editingRole) updateMutation.mutate({ id: editingRole.id, dto: form });
    else createMutation.mutate(form);
  };

  return (
    <AppShell breadcrumb="Admin / Career Roles">
      <div className="app-page admin-page">
        <PageHeader
          title="Career Roles"
          description="Manage the career roles available for roadmap generation."
          actions={<AdminActionButton icon={Plus} label="Create Role" onClick={() => { setEditingRole(null); setForm({ name: '', description: '' }); setShowForm(true); }} />}
        />

        <AdminFormDialog
          isOpen={showForm}
          title={editingRole ? 'Edit Role' : 'Create Role'}
          description="Career roles are used for catalog browsing and roadmap generation."
          submitLabel="Save Role"
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitDisabled={!form.name.trim()}
          onSubmit={handleSave}
          onCancel={() => { setShowForm(false); setEditingRole(null); }}
        >
          <div className="space-y-3">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Role name" className="md3-field w-full px-4" />
            <input type="text" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="md3-field w-full px-4" />
          </div>
        </AdminFormDialog>

        <AdminListToolbar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search roles..."
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={roleSortOptions}
        />

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={Plus} title="Failed to load roles" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <div className="admin-panel admin-table-card">
            <table className="w-full">
              <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Role Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleList.pagedItems.map((role) => (
                  <tr key={role.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--md3-on-surface)]">{role.name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{role.description ?? '—'}</td>
                    <td className="px-6 py-4 text-xs text-[var(--md3-on-surface-variant)]">{new Date(role.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingRole(role); setForm({ name: role.name, description: role.description }); setShowForm(true); }} className="p-2 hover:bg-[var(--md3-primary-container)] rounded-lg transition-colors"><Pencil className="w-4 h-4 text-[var(--md3-primary)]" /></button>
                        <button onClick={() => setDeleteId(role.id)} className="p-2 hover:bg-[var(--md3-error-container)] rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-[var(--md3-error)]" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination {...roleList} onPageChange={roleList.setPage} />
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Career Role?" message="This will permanently remove the career role." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
