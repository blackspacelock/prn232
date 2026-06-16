import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { Code2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { appendCachedListItem, removeCachedListItem, replaceCachedListItem } from '@/lib/apolloCache';
import { GET_TECHNICAL_SKILLS } from '@/graphql/queries';

interface TechnicalSkill {
  id: string;
  name: string;
  category: string;
}

interface TechnicalSkillForm {
  name: string;
  category: string;
}

type SkillSortKey = 'name' | 'category';

const skillSortOptions = [
  { value: 'name', label: 'Skill name' },
  { value: 'category', label: 'Category' },
] satisfies Array<{ value: SkillSortKey; label: string }>;

export function AdminTechnicalSkillsPage() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SkillSortKey>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<TechnicalSkill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TechnicalSkillForm>({ name: '', category: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { data, loading, error, refetch } = useQuery(GET_TECHNICAL_SKILLS);
  const skills: TechnicalSkill[] = useMemo(
    () => (data as { technicalSkills?: TechnicalSkill[] } | undefined)?.technicalSkills ?? [],
    [data],
  );

  const categories = useMemo(
    () => Array.from(new Set(skills.map((skill) => skill.category))).sort((a, b) => a.localeCompare(b)),
    [skills],
  );

  const skillList = useAdminList({
    items: skills,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (skill, term) => `${skill.name} ${skill.category}`.toLowerCase().includes(term),
    getSortValue: (skill, key) => skill[key],
  });

  const queryOptions = { query: GET_TECHNICAL_SKILLS };
  const showError = (message: string) => setSnackbar({ open: true, message });

  const createMutation = useMutation({
    mutationFn: (dto: TechnicalSkillForm) => apiClient.post<TechnicalSkill>('/api/technical-skills', dto).then((r) => r.data),
    onSuccess: (skill) => {
      appendCachedListItem<TechnicalSkill>(queryOptions, 'technicalSkills', skill);
      setShowForm(false);
      setForm({ name: '', category: '' });
    },
    onError: (e: unknown) => showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to create technical skill.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TechnicalSkillForm }) => apiClient.put<TechnicalSkill>(`/api/technical-skills/${id}`, dto).then((r) => r.data),
    onSuccess: (skill) => {
      replaceCachedListItem<TechnicalSkill>(queryOptions, 'technicalSkills', skill);
      setEditingSkill(null);
      setShowForm(false);
    },
    onError: (e: unknown) => showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to update technical skill.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/technical-skills/${id}`),
    onSuccess: (_data, id) => {
      removeCachedListItem<TechnicalSkill>(queryOptions, 'technicalSkills', id);
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      showError((e as { response?: { data?: string | { message?: string } } })?.response?.data?.toString?.() ?? 'Failed to delete technical skill.');
      setDeleteId(null);
    },
  });

  const openCreateForm = () => {
    setEditingSkill(null);
    setForm({ name: '', category: categories[0] ?? '' });
    setShowForm(true);
  };

  const openEditForm = (skill: TechnicalSkill) => {
    setEditingSkill(skill);
    setForm({ name: skill.name, category: skill.category });
    setShowForm(true);
  };

  const handleSave = () => {
    const dto = { name: form.name.trim(), category: form.category.trim() };
    if (editingSkill) updateMutation.mutate({ id: editingSkill.id, dto });
    else createMutation.mutate(dto);
  };

  return (
    <AppShell breadcrumb="Admin / Technical Skills">
      <div className="app-page admin-page">
        <PageHeader
          title="Technical Skills"
          description="Manage the shared skill catalog used for profiles, gap analysis, and recommendations."
          actions={<AdminActionButton icon={Plus} label="Create Skill" onClick={openCreateForm} />}
        />

        <AdminFormDialog
          isOpen={showForm}
          title={editingSkill ? 'Edit Skill' : 'Create Skill'}
          description="Technical skills are reused across profiles and learning content."
          submitLabel="Save Skill"
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitDisabled={!form.name.trim() || !form.category.trim()}
          onSubmit={handleSave}
          onCancel={() => { setShowForm(false); setEditingSkill(null); }}
        >
          <div className="space-y-3">
            <AdminField label="Skill name" description="Use the canonical technology name learners and admins will recognize." required>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Skill name" className="md3-field w-full px-4" />
            </AdminField>
            <AdminField label="Category" description="Group related skills together for profile setup and skill-gap summaries." required>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" list="technical-skill-categories" className="md3-field w-full px-4" />
            </AdminField>
            <datalist id="technical-skill-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </div>
        </AdminFormDialog>

        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search skills..."
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={skillSortOptions}
        />

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : error ? (
          <EmptyState icon={Code2} title="Failed to load skills" description="Please try again." actionLabel="Retry" onAction={refetch} />
        ) : skillList.totalItems === 0 ? (
          <EmptyState icon={Code2} title="No skills found" description={search ? 'No skills match the current search.' : 'Create the first technical skill.'} actionLabel="Create Skill" onAction={openCreateForm} />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3">
              {skillList.pagedItems.map((skill) => (
                <AdminRecordCard
                  key={skill.id}
                  eyebrow={<span className="rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">{skill.category}</span>}
                  title={skill.name}
                  description={<span className="text-xs">{skill.id}</span>}
                  actions={
                    <>
                      <button type="button" onClick={() => openEditForm(skill)} className="rounded-md p-2 hover:bg-[var(--md3-primary-container)]" aria-label={`Edit ${skill.name}`}><Pencil className="h-4 w-4 text-[var(--md3-primary)]" /></button>
                      <button type="button" onClick={() => setDeleteId(skill.id)} className="rounded-md p-2 hover:bg-[var(--md3-error-container)]" aria-label={`Delete ${skill.name}`}><Trash2 className="h-4 w-4 text-[var(--md3-error)]" /></button>
                    </>
                  }
                />
              ))}
            </div>
            <div className="admin-panel">
              <AdminPagination {...skillList} onPageChange={skillList.setPage} />
            </div>
          </div>
        )}

        <ConfirmDialog isOpen={deleteId !== null} title="Delete Technical Skill?" message="This will permanently remove the skill if no dependent data blocks deletion." confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} />
        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}
