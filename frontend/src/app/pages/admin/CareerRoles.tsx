import { useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormDialog, type FormDialogField } from '../../components/FormDialog';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { appToast } from '../../components/AppToast';

interface CareerRole {
  id: number;
  name: string;
  description: string;
  roadmapCount: number;
  createdDate: string;
}

const mockRoles: CareerRole[] = [
  { id: 1, name: 'Frontend Developer', description: 'Build user interfaces with modern frameworks', roadmapCount: 3, createdDate: 'Jan 15, 2025' },
  { id: 2, name: 'Backend Developer', description: 'Develop server-side applications and APIs', roadmapCount: 2, createdDate: 'Jan 20, 2025' },
  { id: 3, name: 'Full Stack Developer', description: 'Combine frontend and backend development skills', roadmapCount: 4, createdDate: 'Feb 1, 2025' },
  { id: 4, name: 'DevOps Engineer', description: 'Manage infrastructure and deployment pipelines', roadmapCount: 2, createdDate: 'Feb 10, 2025' },
  { id: 5, name: 'Mobile Developer', description: 'Create native and cross-platform mobile apps', roadmapCount: 2, createdDate: 'Feb 15, 2025' },
];

export function AdminCareerRolesPage() {
  const [roles, setRoles] = useState<CareerRole[]>(mockRoles);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; roleId: number | null }>({
    isOpen: false,
    roleId: null,
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CareerRole | null>(null);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (roleId: number) => {
    setDeleteConfirm({ isOpen: true, roleId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.roleId) {
      setRoles(roles.filter(r => r.id !== deleteConfirm.roleId));
      appToast.success('Career role deleted successfully');
      setDeleteConfirm({ isOpen: false, roleId: null });
    }
  };

  const roleFields: FormDialogField[] = [
    {
      name: 'name',
      label: 'Role name',
      defaultValue: editingRole?.name ?? '',
      colSpan: 2,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      defaultValue: editingRole?.description ?? '',
      colSpan: 2,
    },
  ];

  return (
    <AppShell breadcrumb="Admin / Career Roles">
      <div className="app-page">
        <PageHeader
          title="Career Roles"
          description="Define target career paths available to students."
          actions={
          <AdminActionButton
            icon={Plus}
            label="New Career Role"
            variant="primary"
            size="md"
            onClick={() => setCreateModalOpen(true)}
          />
          }
        />

        {/* Search */}
        <div className="md3-panel flex items-center gap-3 p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search career roles..."
            className="md3-field w-full pl-12 pr-4"
          />
        </div>
        </div>

        {/* Data Table */}
        <div className="md3-card overflow-hidden">
          <table className="md3-data-table">
            <thead>
              <tr className="bg-[var(--md3-surface-container)] border-b-2 border-[var(--md3-outline-variant)]">
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider">
                  Roadmaps
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role, index) => (
                <tr
                  key={role.id}
                  className={`border-b border-[var(--md3-outline-variant)] hover:bg-[var(--md3-surface-variant)] transition-colors ${
                    index % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[var(--md3-on-surface)]">
                      {role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--md3-on-surface-variant)] line-clamp-2">
                      {role.description}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded-lg text-xs font-medium">
                      {role.roadmapCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--md3-on-surface-variant)]">
                      {role.createdDate}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AdminActionButton
                        icon={Pencil}
                        label="Edit"
                        onClick={() => setEditingRole(role)}
                      />
                      <AdminActionButton
                        icon={Trash2}
                        label="Delete"
                        variant="danger"
                        onClick={() => handleDelete(role.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--md3-outline-variant)]">
            <span className="text-sm font-medium text-[var(--md3-on-surface-variant)]">
              Showing 1–{filteredRoles.length} of {roles.length}
            </span>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)] transition-colors">
                <svg className="w-5 h-5 text-[var(--md3-on-surface-variant)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--md3-primary)] text-white text-sm font-medium">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)] text-sm font-medium hover:bg-[var(--md3-primary)] hover:text-white transition-colors">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)] transition-colors">
                <svg className="w-5 h-5 text-[var(--md3-on-surface-variant)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Career Role?"
          message="Are you sure you want to delete this career role? This action cannot be undone and will affect all associated roadmaps."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, roleId: null })}
        />

        <FormDialog
          isOpen={createModalOpen || editingRole !== null}
          title={editingRole ? 'Edit Career Role' : 'Create Career Role'}
          description="Add or update a target career path for roadmap generation."
          fields={roleFields}
          onCancel={() => {
            setCreateModalOpen(false);
            setEditingRole(null);
          }}
          onSubmit={(values) => {
            const name = String(values.name || 'New Career Role');
            const description = String(values.description || 'Draft role description');

            if (editingRole) {
              setRoles(roles.map((role) => (
                role.id === editingRole.id ? { ...role, name, description } : role
              )));
              appToast.success('Career role updated');
            } else {
              setRoles([
                {
                  id: roles.length + 1,
                  name,
                  description,
                  roadmapCount: 0,
                  createdDate: 'Today',
                },
                ...roles,
              ]);
              appToast.success('Career role created');
            }

            setCreateModalOpen(false);
            setEditingRole(null);
          }}
        />
      </div>
    </AppShell>
  );
}

