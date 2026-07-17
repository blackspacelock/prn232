import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LinearProgress } from '../components/LinearProgress';
import { StatusChip } from '../components/StatusChip';
import { ActiveBadge } from '../components/ActiveBadge';
import { ActionButton, ActionLink } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { AdminListToolbar, AdminPagination, useAdminList, type AdminSortOption } from '../components/admin/AdminListControls';
import { AdminFilterSelect } from '../components/admin/AdminListControls';
import { FolderOpen, MoreVertical, Rocket, Tag, Trash2, X } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { apolloClient } from '@/lib/apollo';
import { removeCachedListItem } from '@/lib/apolloCache';
import {
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
  GET_CAREER_ROLES,
  GET_CAREER_ROADMAPS_BY_ROLE,
} from '@/graphql/queries';
import type { AddRoadmapTagDto, GeneratePersonalRoadmapRequestDto, PersonalRoadmapDetailDto, PersonalRoadmapDto, RoadmapTagDto } from '@/types/api';

interface CareerRole { id: string; name: string; description?: string }
interface CareerRoadmap { id: string; name: string; description?: string }
type PersonalRoadmap = PersonalRoadmapDto;

type RoadmapSort = 'name' | 'progress' | 'createdAt';

const SORT_OPTIONS: AdminSortOption<RoadmapSort>[] = [
  { value: 'name', label: 'Name' },
  { value: 'progress', label: 'Progress' },
  { value: 'createdAt', label: 'Date Added' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'not-started', label: 'Not Started' },
];

function toPersonalRoadmapListItem(roadmap: PersonalRoadmapDetailDto): PersonalRoadmap {
  return {
    id: roadmap.id,
    profileId: roadmap.profileId,
    careerRoadmapId: roadmap.careerRoadmapId,
    careerRoadmapName: roadmap.careerRoadmapName,
    careerRoadmapDescription: roadmap.careerRoadmapDescription,
    note: roadmap.note,
    progressPercentage: roadmap.progressPercentage,
    inProgressCount: roadmap.nodeProgresses.filter((node) => node.status === 1).length,
    isActive: roadmap.isActive,
    createdAt: roadmap.createdAt,
    tags: roadmap.tags ?? [],
  };
}

export function RoadmapsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [tagModalRoadmap, setTagModalRoadmap] = useState<PersonalRoadmap | null>(null);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RoadmapSort>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const { data: roadmapsData, loading: roadmapsLoading, error: roadmapsError, refetch: refetchRoadmaps } = useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: rolesData, loading: rolesLoading } = useQuery(GET_CAREER_ROLES);
  const [loadRoadmapsByRole, { data: roadmapsByRoleData, loading: roadmapsByRoleLoading }] = useLazyQuery(GET_CAREER_ROADMAPS_BY_ROLE);

  const allRoadmaps: PersonalRoadmap[] = (roadmapsData as { personalRoadmapsByProfile?: PersonalRoadmap[] })?.personalRoadmapsByProfile ?? [];
  const careerRoles: CareerRole[] = (rolesData as { careerRoles?: CareerRole[] })?.careerRoles ?? [];
  const careerRoadmaps: CareerRoadmap[] = (roadmapsByRoleData as { careerRoadmapsByRole?: CareerRoadmap[] })?.careerRoadmapsByRole ?? [];
  const personalRoadmapsQueryOptions = { query: GET_PERSONAL_ROADMAPS_BY_PROFILE, variables: { profileId } };

  const statusFilteredRoadmaps = statusFilter
    ? allRoadmaps.filter((r) => {
        const progress = Math.round(r.progressPercentage);
        if (statusFilter === 'active') return r.isActive;
        if (statusFilter === 'completed') return progress === 100;
        if (statusFilter === 'in-progress') return progress < 100 && (progress > 0 || r.inProgressCount > 0);
        if (statusFilter === 'not-started') return progress === 0 && r.inProgressCount === 0;
        return true;
      })
    : allRoadmaps;

  const roadmapList = useAdminList<PersonalRoadmap, RoadmapSort>({
    items: statusFilteredRoadmaps,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (r, term) =>
      (r.careerRoadmapName ?? '').toLowerCase().includes(term) ||
      (r.note ?? '').toLowerCase().includes(term) ||
      new Date(r.createdAt).toLocaleDateString().includes(term),
    getSortValue: (r, key) => {
      if (key === 'name') return r.careerRoadmapName ?? '';
      if (key === 'progress') return r.progressPercentage;
      return r.createdAt;
    },
  });

  const generateMutation = useMutation({
    mutationFn: (dto: GeneratePersonalRoadmapRequestDto) =>
      apiClient.post<PersonalRoadmapDetailDto>('/api/personal-roadmaps/generate', dto).then((r) => r.data),
    onSuccess: async (data) => {
      const newRoadmap = toPersonalRoadmapListItem(data);
      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(personalRoadmapsQueryOptions, (current) => {
        if (!current?.personalRoadmapsByProfile) return current;
        const withoutDuplicate = current.personalRoadmapsByProfile.filter((roadmap) => roadmap.id !== newRoadmap.id);
        return {
          personalRoadmapsByProfile: [
            newRoadmap,
            ...withoutDuplicate,
          ],
        };
      });
      setIsModalOpen(false);
      navigate(`/roadmap/${data.id}`);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to generate roadmap.';
      showError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWithCascadeMode(`/api/personal-roadmaps/${id}`),
    onSuccess: (_data, id) => {
      removeCachedListItem<PersonalRoadmap>(personalRoadmapsQueryOptions, 'personalRoadmapsByProfile', id);
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete roadmap.';
      showError(msg);
      setDeleteId(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/api/personal-roadmaps/${id}/toggle-active`),
    onMutate: async (id: string) => {
      const queryOptions = { ...personalRoadmapsQueryOptions };
      const previousRoadmaps = apolloClient.cache.readQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(queryOptions);

      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(queryOptions, (current) => {
        if (!current?.personalRoadmapsByProfile) return current;
        return {
          personalRoadmapsByProfile: current.personalRoadmapsByProfile.map((roadmap) =>
            roadmap.id === id ? { ...roadmap, isActive: !roadmap.isActive } : roadmap
          ),
        };
      });

      return { previousRoadmaps, queryOptions };
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update active roadmap.';
      showError(msg);
    },
    onSettled: (_data, error, _variables, context) => {
      if (error && context?.previousRoadmaps) {
        apolloClient.cache.writeQuery({
          ...context.queryOptions,
          data: context.previousRoadmaps,
        });
      }
    },
  });

  const addTagMutation = useMutation({
    mutationFn: ({ roadmapId, dto }: { roadmapId: string; dto: AddRoadmapTagDto }) =>
      apiClient.post<RoadmapTagDto>(`/api/personal-roadmaps/${roadmapId}/tags`, dto).then((r) => r.data),
    onSuccess: (newTag, { roadmapId }) => {
      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(personalRoadmapsQueryOptions, (current) => {
        if (!current?.personalRoadmapsByProfile) return current;
        return {
          personalRoadmapsByProfile: current.personalRoadmapsByProfile.map((rm) =>
            rm.id === roadmapId ? { ...rm, tags: [...(rm.tags ?? []), newTag] } : rm
          ),
        };
      });
      // Sync tagModalRoadmap state so the modal updates immediately
      setTagModalRoadmap((prev) => prev?.id === roadmapId ? { ...prev, tags: [...(prev.tags ?? []), newTag] } : prev);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      showError(typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to add tag.'));
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: ({ roadmapId, tagId }: { roadmapId: string; tagId: string }) =>
      deleteWithCascadeMode(`/api/personal-roadmaps/${roadmapId}/tags/${tagId}`),
    onSuccess: (_data, { roadmapId, tagId }) => {
      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(personalRoadmapsQueryOptions, (current) => {
        if (!current?.personalRoadmapsByProfile) return current;
        return {
          personalRoadmapsByProfile: current.personalRoadmapsByProfile.map((rm) =>
            rm.id === roadmapId ? { ...rm, tags: (rm.tags ?? []).filter((t) => t.id !== tagId) } : rm
          ),
        };
      });
      setTagModalRoadmap((prev) => prev?.id === roadmapId ? { ...prev, tags: (prev.tags ?? []).filter((t) => t.id !== tagId) } : prev);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove tag.';
      showError(msg);
    },
  });

  if (roadmapsLoading) {
    return (
      <AppShell breadcrumb="Roadmaps">
        <div className="app-page">
          <div className="desktop-grid-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  if (roadmapsError) {
    return (
      <AppShell breadcrumb="Roadmaps">
        <div className="app-page">
          <EmptyState icon={Rocket} title="Failed to load roadmaps" description="Please try again." actionLabel="Retry" onAction={refetchRoadmaps} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Roadmaps">
      <div className="app-page">
        <PageHeader
          title="My Roadmaps"
          description="Track and manage your personalized learning paths."
          actions={
            <ActionButton icon={Rocket} label="Generate Roadmap" variant="primary" size="md" onClick={() => setIsModalOpen(true)} />
          }
        />

        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search roadmaps..."
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={SORT_OPTIONS}
        >
          <AdminFilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            ariaLabel="Filter by status"
            label="Status"
          />
        </AdminListToolbar>

        {roadmapList.pagedItems.length > 0 ? (
          <>
            <div className="desktop-grid-3">
              {roadmapList.pagedItems.map((roadmap) => (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  onDelete={() => setDeleteId(roadmap.id)}
                  onActivate={() => activateMutation.mutate(roadmap.id)}
                  activating={activateMutation.isPending && activateMutation.variables === roadmap.id}
                  onManageTags={() => setTagModalRoadmap(roadmap)}
                />
              ))}
            </div>
            <AdminPagination {...roadmapList} onPageChange={roadmapList.setPage} />
          </>
        ) : (
          <EmptyState
            icon={Rocket}
            title={search || statusFilter ? 'No roadmaps match your filters' : 'No roadmaps yet'}
            description={search || statusFilter ? 'Try adjusting your search or filter.' : 'Generate a personalized roadmap from an available career role to begin tracking your progress.'}
            actionLabel="Generate Roadmap"
            onAction={() => setIsModalOpen(true)}
          />
        )}

        <ActionButton
          icon={Rocket}
          label="Generate Roadmap"
          variant="primary"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 shadow-lg"
          style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' }}
        />

        {isModalOpen && (
          <GenerateRoadmapModalWired
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            careerRoles={careerRoles}
            rolesLoading={rolesLoading}
            careerRoadmaps={careerRoadmaps}
            roadmapsLoading={roadmapsByRoleLoading}
            onRoleSelect={(roleId) => loadRoadmapsByRole({ variables: { careerRoleId: roleId } })}
            onGenerate={(careerRoadmapId) => {
              generateMutation.mutate({ profileId, careerRoadmapId });
            }}
            generating={generateMutation.isPending}
          />
        )}

        <ConfirmDialog
          isOpen={deleteId !== null}
          title="Delete Roadmap?"
          message="This roadmap will be removed from your list. Your account and profile data are not affected."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
          onCancel={() => setDeleteId(null)}
        />

        {tagModalRoadmap && (
          <TagManagerModal
            roadmap={tagModalRoadmap}
            onClose={() => setTagModalRoadmap(null)}
            onAddTag={(dto) => addTagMutation.mutate({ roadmapId: tagModalRoadmap.id, dto })}
            onDeleteTag={(tagId) => deleteTagMutation.mutate({ roadmapId: tagModalRoadmap.id, tagId })}
            adding={addTagMutation.isPending}
          />
        )}

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}

function RoadmapCard({ roadmap, onDelete, onActivate, activating, onManageTags }: { roadmap: PersonalRoadmap; onDelete: () => void; onActivate: () => void; activating: boolean; onManageTags: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const progress = Math.round(roadmap.progressPercentage);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);
  const hasInProgress = roadmap.inProgressCount > 0;
  const getProgressColor = () => {
    if (progress >= 70) return 'var(--md3-success)';
    if (progress >= 30) return 'var(--md3-primary)';
    return 'var(--md3-on-surface-variant)';
  };

  return (
    <div className="md3-card relative p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 pr-3">
          <h3 className="truncate text-base font-medium text-[var(--md3-on-surface)]">
            {roadmap.careerRoadmapName || 'Roadmap'}
          </h3>
          {roadmap.careerRoadmapDescription && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--md3-on-surface-variant)]">
              {roadmap.careerRoadmapDescription}
            </p>
          )}
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]" aria-label="Roadmap actions">
          <MoreVertical className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div ref={menuRef} className="absolute right-4 top-14 z-10 min-w-40 rounded-xl border border-[var(--md3-outline-variant)] bg-white p-1 shadow-lg">
            <ActionButton icon={Tag} label="Manage Tags" variant="text" onClick={() => { setMenuOpen(false); onManageTags(); }} className="w-full justify-start rounded-lg" />
            <ActionButton icon={Trash2} label="Delete" variant="danger" onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full justify-start rounded-lg" />
          </div>
        )}
      </div>

      {/* Tags */}
      {roadmap.tags && roadmap.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {roadmap.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: tag.color ? `${tag.color}22` : 'var(--md3-surface-variant)',
                color: tag.color ?? 'var(--md3-on-surface-variant)',
                border: `1px solid ${tag.color ? `${tag.color}55` : 'var(--md3-outline-variant)'}`,
              }}
            >
              <Tag className="h-3 w-3" />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--md3-on-surface-variant)]">Progress</span>
        <span className="text-base font-medium" style={{ color: getProgressColor() }}>{progress}%</span>
      </div>

      <div className="mb-4">
        <LinearProgress value={progress} color={getProgressColor()} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {roadmap.isActive && <ActiveBadge />}
        {progress === 100 ? (
          <StatusChip status="completed" count={0} label="Completed" />
        ) : progress > 0 || hasInProgress ? (
          <StatusChip status="in-progress" count={roadmap.inProgressCount} label="In Progress" />
        ) : (
          <StatusChip status="not-started" count={0} label="Not Started" />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--md3-outline-variant)]">
        <span className="text-xs text-[var(--md3-on-surface-variant)]">
          {new Date(roadmap.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={roadmap.isActive}
            disabled={activating}
            loading={activating}
            label="Active"
            loadingLabel="Updating..."
            activeTone="success"
            aria-label={roadmap.isActive ? 'Deactivate roadmap' : 'Activate roadmap'}
            onChange={onActivate}
          />
          <ActionLink icon={FolderOpen} label="Open" to={`/roadmap/${roadmap.id}`} />
        </div>
      </div>
    </div>
  );
}

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  careerRoles: CareerRole[];
  rolesLoading: boolean;
  careerRoadmaps: CareerRoadmap[];
  roadmapsLoading: boolean;
  onRoleSelect: (roleId: string) => void;
  onGenerate: (careerRoadmapId: string) => void;
  generating: boolean;
}

function GenerateRoadmapModalWired({ isOpen, onClose, careerRoles, rolesLoading, careerRoadmaps, roadmapsLoading, onRoleSelect, onGenerate, generating }: GenerateModalProps) {
  const [step, setStep] = useState<'select-role' | 'select-roadmap' | 'generating'>('select-role');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    setSelectedRoadmapId(null);
    onRoleSelect(roleId);
  };

  const handleGenerate = () => {
    if (selectedRoadmapId) {
      setStep('generating');
      onGenerate(selectedRoadmapId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={step !== 'generating' ? onClose : undefined} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[640px] mx-4 p-6">
        {step === 'generating' ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 border-4 border-[var(--md3-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Building your roadmap...</h2>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-1">Generate Roadmap</h2>
            <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">Select a career role and roadmap template to get a personalized learning path.</p>
            {rolesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">1. Select Career Role</p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {careerRoles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                        selectedRoleId === role.id
                          ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-primary)]'
                          : 'border-[var(--md3-outline)] hover:border-[var(--md3-on-surface-variant)]'
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedRoleId && (
              <div className="mb-6">
                <p className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">2. Select Roadmap Template</p>
                {roadmapsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                  </div>
                ) : careerRoadmaps.length === 0 ? (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No roadmap templates for this role.</p>
                ) : (
                  <div className="space-y-2">
                    {careerRoadmaps.map((rm) => (
                      <button
                        key={rm.id}
                        onClick={() => setSelectedRoadmapId(rm.id)}
                        className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                          selectedRoadmapId === rm.id
                            ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)] text-[var(--md3-primary)]'
                            : 'border-[var(--md3-outline)] hover:border-[var(--md3-on-surface-variant)]'
                        }`}
                      >
                        {rm.name}
                        {rm.description && <span className="block text-xs text-[var(--md3-on-surface-variant)] mt-0.5">{rm.description}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <ActionButton icon={Rocket} label="Cancel" variant="text" onClick={onClose} />
              <ActionButton
                icon={Rocket}
                label={generating ? 'Generating...' : 'Generate Roadmap'}
                variant="primary"
                size="md"
                onClick={handleGenerate}
                disabled={!selectedRoadmapId || generating}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tag Manager Modal ──────────────────────────────────────────────────────

interface TagManagerModalProps {
  roadmap: PersonalRoadmap;
  onClose: () => void;
  onAddTag: (dto: AddRoadmapTagDto) => void;
  onDeleteTag: (tagId: string) => void;
  adding: boolean;
}

const TAG_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#64748b', // slate
];

function TagManagerModal({ roadmap, onClose, onAddTag, onDeleteTag, adding }: TagManagerModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddTag({ name: trimmed, color });
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Manage Tags</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
          Tags for <span className="font-medium text-[var(--md3-on-surface)]">{roadmap.careerRoadmapName}</span>
        </p>

        {/* Existing tags */}
        {roadmap.tags && roadmap.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-5 p-3 rounded-xl bg-[var(--md3-surface-variant)]">
            {roadmap.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: tag.color ? `${tag.color}22` : '#f1f5f9',
                  color: tag.color ?? 'var(--md3-on-surface-variant)',
                  border: `1px solid ${tag.color ? `${tag.color}55` : '#cbd5e1'}`,
                }}
              >
                <Tag className="h-3 w-3" />
                {tag.name}
                <button
                  onClick={() => onDeleteTag(tag.id)}
                  className="ml-0.5 rounded-full hover:opacity-70"
                  aria-label={`Remove tag ${tag.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--md3-on-surface-variant)] italic mb-5">No tags yet.</p>
        )}

        {/* Add new tag */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--md3-on-surface)]">Add a tag</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tag name..."
            maxLength={100}
            className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)] focus:ring-2 focus:ring-[var(--md3-primary)]/20"
          />
          <div>
            <p className="text-xs text-[var(--md3-on-surface-variant)] mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'var(--md3-on-surface)' : 'transparent',
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          <ActionButton
            icon={Tag}
            label={adding ? 'Adding...' : 'Add Tag'}
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={!name.trim() || adding}
            className="w-full justify-center"
          />
        </div>
      </div>
    </div>
  );
}
