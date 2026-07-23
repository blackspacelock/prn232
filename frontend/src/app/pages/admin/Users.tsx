import { useMemo, useState } from 'react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserX, Users } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { AdminFilterSelect, AdminListToolbar, AdminPagination } from '../../components/admin/AdminListControls';
import { useAdminList } from '../../components/admin/useAdminList';
import { apiClient } from '@/lib/axios';
import type { AdminUpdateUserDto, UserDto } from '@/types/api';

const ROLE_OPTIONS = [
  { value: 0, label: 'Admin' },
  { value: 1, label: 'Mentor' },
  { value: 2, label: 'Student' },
];
type UserSortKey = 'fullName' | 'email' | 'role' | 'isActive' | 'createdAt';
const userSortOptions = [
  { value: 'fullName', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'isActive', label: 'Status' },
  { value: 'createdAt', label: 'Joined date' },
] satisfies Array<{ value: UserSortKey; label: string }>;
const roleFilterOptions = [
  { value: 'All', label: 'All roles' },
  { value: 'Admin', label: 'Admins' },
  { value: 'Mentor', label: 'Mentors' },
  { value: 'Student', label: 'Students' },
] satisfies Array<{ value: 'All' | 'Admin' | 'Mentor' | 'Student'; label: string }>;
const statusFilterOptions = [
  { value: 'All', label: 'All status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
] satisfies Array<{ value: 'All' | 'Active' | 'Inactive'; label: string }>;

function roleLabel(role: number) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? 'Student';
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Mentor' | 'Student'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortKey, setSortKey] = useState<UserSortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' });

  const { data, isLoading, error, refetch } = useRestQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get<UserDto[]>('/api/users').then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AdminUpdateUserDto }) =>
      apiClient.put<UserDto>(`/api/users/${id}/admin`, dto).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserDto[]>(['admin-users'], (old) =>
        (old ?? []).map((user) => (user.id === updated.id ? updated : user)),
      );
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setSnackbar({ open: true, message: 'User updated.', variant: 'success' });
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update user.';
      setSnackbar({ open: true, message, variant: 'error' });
    },
  });

  const users = useMemo(() => data ?? [], [data]);
  const normalUsers = useMemo(() => users.filter((u) => u.role !== 0), [users]);
  const filteredByFacets = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === 'All' || roleLabel(user.role) === roleFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? user.isActive : !user.isActive);
      return matchesRole && matchesStatus;
    });
  }, [users, roleFilter, statusFilter]);
  const userList = useAdminList({
    items: filteredByFacets,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (user, term) => `${user.fullName} ${user.email}`.toLowerCase().includes(term),
    getSortValue: (user, key) => {
      if (key === 'createdAt') return new Date(user.createdAt);
      if (key === 'role') return roleLabel(user.role);
      return user[key];
    },
  });

  const activeCount = normalUsers.filter((u) => u.isActive).length;
  const inactiveCount = normalUsers.filter((u) => !u.isActive).length;

  return (
    <AppShell breadcrumb="Admin / Users">
      <div className="app-page admin-page">
        <PageHeader
          title="User Management"
          description="Review account health, adjust roles, and control access for the SECompass community."
        />

        <div className="desktop-grid-3">
          <SummaryCard icon={Users} label="Total users" value={normalUsers.length} />
          <SummaryCard icon={UserCheck} label="Active" value={activeCount} />
          <SummaryCard icon={UserX} label="Inactive" value={inactiveCount} />
        </div>

        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search users by name or email"
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={userSortOptions}
        >
          <AdminFilterSelect value={roleFilter} onChange={setRoleFilter} options={roleFilterOptions} ariaLabel="Filter users by role" />
          <AdminFilterSelect value={statusFilter} onChange={setStatusFilter} options={statusFilterOptions} ariaLabel="Filter users by status" />
        </AdminListToolbar>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={Users} title="Failed to load users" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : (
          <div className="admin-panel admin-table-card">
            <table className="w-full">
              <thead className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.pagedItems.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--md3-primary-container)] text-sm font-semibold text-[var(--md3-primary)]">
                          {user.avatarUrl
                            ? <img src={user.avatarUrl} alt={user.fullName || user.email} className="h-full w-full object-cover" />
                            : (user.fullName || user.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{user.fullName || 'Unnamed user'}</p>
                          <p className="truncate text-xs text-[var(--md3-on-surface-variant)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(event) => updateMutation.mutate({ id: user.id, dto: { role: Number(event.target.value) } })}
                        className="h-10 rounded-md border border-[var(--md3-outline)] bg-white px-3 text-sm"
                      >
                        {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${user.isActive ? 'bg-[var(--md3-success-container)] text-[var(--md3-success)]' : 'bg-[var(--md3-error-container)] text-[var(--md3-error)]'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--md3-on-surface-variant)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <ToggleSwitch
                          checked={user.isActive}
                          label={user.isActive ? 'Enabled' : 'Disabled'}
                          activeTone="success"
                          onChange={() => updateMutation.mutate({ id: user.id, dto: { isActive: !user.isActive } })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination {...userList} onPageChange={userList.setPage} />
          </div>
        )}

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'success' })} />
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="admin-panel p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-[var(--md3-on-surface-variant)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--md3-on-surface)]">{value.toLocaleString()}</p>
    </div>
  );
}
