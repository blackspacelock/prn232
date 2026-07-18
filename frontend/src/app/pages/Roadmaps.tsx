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
import { SkillSearchPicker } from '../components/SkillSearchPicker';
import { AdminFilterSelect, AdminListToolbar, AdminPagination } from '../components/admin/AdminListControls';
import { useAdminList, type AdminSortOption } from '../components/admin/useAdminList';
import { Copy, FolderOpen, Globe2, MoreVertical, Plus, Rocket, Share2, Tag, Trash2, X } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { apolloClient } from '@/lib/apollo';
import { removeCachedListItem } from '@/lib/apolloCache';
import {
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
  GET_SHARED_PERSONAL_ROADMAPS,
  GET_CAREER_ROLES,
  GET_CAREER_ROADMAPS_BY_ROLE,
  GET_TECHNICAL_SKILLS,
} from '@/graphql/queries';
import type { AddRoadmapTagDto, CopySharedRoadmapRequestDto, CreatePersonalRoadmapDto, GeneratePersonalRoadmapRequestDto, PersonalRoadmapDetailDto, PersonalRoadmapDto, RoadmapTagDto, TechnicalSkillDto } from '@/types/api';

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
    isShared: roadmap.isShared,
    sharedAt: roadmap.sharedAt,
    ownerName: roadmap.ownerName,
    createdAt: roadmap.createdAt,
    tags: roadmap.tags ?? [],
  };
}

export function RoadmapsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [tagModalRoadmap, setTagModalRoadmap] = useState<PersonalRoadmap | null>(null);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RoadmapSort>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [viewMode, setViewMode] = useState<'mine' | 'shared'>('mine');

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const { data: roadmapsData, loading: roadmapsLoading, error: roadmapsError, refetch: refetchRoadmaps } = useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });
  const { data: sharedRoadmapsData, loading: sharedRoadmapsLoading, refetch: refetchSharedRoadmaps } = useQuery(GET_SHARED_PERSONAL_ROADMAPS);

  const { data: rolesData, loading: rolesLoading } = useQuery(GET_CAREER_ROLES);
  const { data: technicalSkillsData } = useQuery(GET_TECHNICAL_SKILLS);
  const [loadRoadmapsByRole, { data: roadmapsByRoleData, loading: roadmapsByRoleLoading }] = useLazyQuery(GET_CAREER_ROADMAPS_BY_ROLE);

  const allRoadmaps: PersonalRoadmap[] = (roadmapsData as { personalRoadmapsByProfile?: PersonalRoadmap[] })?.personalRoadmapsByProfile ?? [];
  const sharedRoadmaps: PersonalRoadmap[] = (sharedRoadmapsData as { sharedPersonalRoadmaps?: PersonalRoadmap[] })?.sharedPersonalRoadmaps ?? [];
  const careerRoles: CareerRole[] = (rolesData as { careerRoles?: CareerRole[] })?.careerRoles ?? [];
  const technicalSkills: TechnicalSkillDto[] = (technicalSkillsData as { technicalSkills?: TechnicalSkillDto[] })?.technicalSkills ?? [];
  const careerRoadmaps: CareerRoadmap[] = (roadmapsByRoleData as { careerRoadmapsByRole?: CareerRoadmap[] })?.careerRoadmapsByRole ?? [];
  const personalRoadmapsQueryOptions = { query: GET_PERSONAL_ROADMAPS_BY_PROFILE, variables: { profileId } };

  const baseRoadmaps = viewMode === 'mine' ? allRoadmaps : sharedRoadmaps;
  const tagOptions = [
    { value: '', label: 'All Tags' },
    ...Array.from(
      new Map(
        baseRoadmaps
          .flatMap((roadmap) => roadmap.tags ?? [])
          .map((tag) => [tag.name.toLowerCase(), tag.name] as const),
      ).values(),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name })),
  ];
  const statusFilteredRoadmaps = statusFilter
    ? baseRoadmaps.filter((r) => {
        const progress = Math.round(r.progressPercentage);
        if (statusFilter === 'active') return r.isActive;
        if (statusFilter === 'completed') return progress === 100;
        if (statusFilter === 'in-progress') return progress < 100 && (progress > 0 || r.inProgressCount > 0);
        if (statusFilter === 'not-started') return progress === 0 && r.inProgressCount === 0;
        return true;
      })
    : baseRoadmaps;
  const filteredRoadmaps = tagFilter
    ? statusFilteredRoadmaps.filter((roadmap) =>
        (roadmap.tags ?? []).some((tag) => tag.name.toLowerCase() === tagFilter.toLowerCase()),
      )
    : statusFilteredRoadmaps;

  const roadmapList = useAdminList<PersonalRoadmap, RoadmapSort>({
    items: filteredRoadmaps,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (r, term) =>
      (r.careerRoadmapName ?? '').toLowerCase().includes(term) ||
      (r.note ?? '').toLowerCase().includes(term) ||
      (r.tags ?? []).some((tag) => tag.name.toLowerCase().includes(term)) ||
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

  const createMutation = useMutation({
    mutationFn: (dto: CreatePersonalRoadmapDto) =>
      apiClient.post<PersonalRoadmapDetailDto>('/api/personal-roadmaps', dto).then((r) => r.data),
    onSuccess: async (data) => {
      const newRoadmap = toPersonalRoadmapListItem(data);
      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(personalRoadmapsQueryOptions, (current) => ({
        personalRoadmapsByProfile: [newRoadmap, ...(current?.personalRoadmapsByProfile?.filter((roadmap) => roadmap.id !== newRoadmap.id) ?? [])],
      }));
      setIsCreateModalOpen(false);
      navigate(`/roadmap/${data.id}`);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      showError(typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to create roadmap.'));
    },
  });

  const copySharedMutation = useMutation({
    mutationFn: ({ roadmapId, dto }: { roadmapId: string; dto: CopySharedRoadmapRequestDto }) =>
      apiClient.post<PersonalRoadmapDetailDto>(`/api/personal-roadmaps/shared/${roadmapId}/copy`, dto).then((r) => r.data),
    onSuccess: (data) => {
      const newRoadmap = toPersonalRoadmapListItem(data);
      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(personalRoadmapsQueryOptions, (current) => ({
        personalRoadmapsByProfile: [newRoadmap, ...(current?.personalRoadmapsByProfile?.filter((roadmap) => roadmap.id !== newRoadmap.id) ?? [])],
      }));
      setViewMode('mine');
      navigate(`/roadmap/${data.id}`);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      showError(typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to copy shared roadmap.'));
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

  const shareMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/api/personal-roadmaps/${id}/toggle-shared`),
    onSuccess: async (_data, id) => {
      apolloClient.cache.updateQuery<{ personalRoadmapsByProfile?: PersonalRoadmap[] }>(personalRoadmapsQueryOptions, (current) => {
        if (!current?.personalRoadmapsByProfile) return current;
        return {
          personalRoadmapsByProfile: current.personalRoadmapsByProfile.map((roadmap) =>
            roadmap.id === id
              ? { ...roadmap, isShared: !roadmap.isShared, sharedAt: roadmap.isShared ? undefined : new Date().toISOString() }
              : roadmap
          ),
        };
      });
      await refetchSharedRoadmaps();
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update sharing.';
      showError(msg);
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

  if (roadmapsLoading || (viewMode === 'shared' && sharedRoadmapsLoading)) {
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
          description="Create, track, and share personalized learning paths."
          actions={
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={Plus} label="Create Personal" variant="tonal" size="md" onClick={() => setIsCreateModalOpen(true)} />
              <ActionButton icon={Rocket} label="Generate Roadmap" variant="primary" size="md" onClick={() => setIsModalOpen(true)} />
            </div>
          }
        />

        <div className="mb-4 inline-flex rounded-xl border border-[var(--md3-outline-variant)] bg-white p-1">
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === 'mine' ? 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface-variant)]'}`}
            onClick={() => setViewMode('mine')}
          >
            My Roadmaps
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === 'shared' ? 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface-variant)]'}`}
            onClick={() => setViewMode('shared')}
          >
            Shared Roadmaps
          </button>
        </div>

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
          <AdminFilterSelect
            value={tagFilter}
            onChange={setTagFilter}
            options={tagOptions}
            ariaLabel="Filter by tag"
            label="Tag"
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
                  onToggleShare={() => shareMutation.mutate(roadmap.id)}
                  sharing={shareMutation.isPending && shareMutation.variables === roadmap.id}
                  onCopy={() => copySharedMutation.mutate({ roadmapId: roadmap.id, dto: { profileId } })}
                  copying={copySharedMutation.isPending && copySharedMutation.variables?.roadmapId === roadmap.id}
                  readonly={viewMode === 'shared'}
                />
              ))}
            </div>
            <AdminPagination {...roadmapList} onPageChange={roadmapList.setPage} />
          </>
        ) : (
          <EmptyState
            icon={Rocket}
            title={search || statusFilter || tagFilter ? 'No roadmaps match your filters' : 'No roadmaps yet'}
            description={search || statusFilter || tagFilter ? 'Try adjusting your search or filter.' : viewMode === 'shared' ? 'Shared student roadmaps will appear here once learners publish them.' : 'Create your own roadmap or generate one from an available career role to begin tracking progress.'}
            actionLabel={viewMode === 'shared' ? 'Refresh' : 'Create Personal Roadmap'}
            onAction={viewMode === 'shared' ? refetchSharedRoadmaps : () => setIsCreateModalOpen(true)}
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

        {isCreateModalOpen && (
          <CreatePersonalRoadmapModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            careerRoles={careerRoles}
            technicalSkills={technicalSkills}
            rolesLoading={rolesLoading}
            profileId={profileId}
            onCreate={(dto) => createMutation.mutate(dto)}
            creating={createMutation.isPending}
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

function RoadmapCard({ roadmap, onDelete, onActivate, activating, onManageTags, onToggleShare, sharing, onCopy, copying, readonly }: { roadmap: PersonalRoadmap; onDelete: () => void; onActivate: () => void; activating: boolean; onManageTags: () => void; onToggleShare: () => void; sharing: boolean; onCopy: () => void; copying: boolean; readonly?: boolean }) {
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
    <div className="md3-card relative flex h-full min-h-[300px] flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="min-h-[64px] min-w-0 pr-3">
          <h3 className="truncate text-base font-medium text-[var(--md3-on-surface)]">
            {roadmap.careerRoadmapName || 'Roadmap'}
          </h3>
          {roadmap.careerRoadmapDescription && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--md3-on-surface-variant)]">
              {roadmap.careerRoadmapDescription}
            </p>
          )}
        </div>
        {!readonly && (
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]" aria-label="Roadmap actions">
            <MoreVertical className="h-5 w-5" />
          </button>
        )}
        {menuOpen && !readonly && (
          <div ref={menuRef} className="absolute right-4 top-14 z-10 min-w-40 rounded-xl border border-[var(--md3-outline-variant)] bg-white p-1 shadow-lg">
            <ActionButton icon={Tag} label="Manage Tags" variant="text" onClick={() => { setMenuOpen(false); onManageTags(); }} className="w-full justify-start rounded-lg" />
            <ActionButton icon={Share2} label={roadmap.isShared ? 'Unshare' : 'Share'} variant="text" onClick={() => { setMenuOpen(false); onToggleShare(); }} className="w-full justify-start rounded-lg" />
            <ActionButton icon={Trash2} label="Delete" variant="danger" onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full justify-start rounded-lg" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--md3-on-surface-variant)]">Progress</span>
          <span className="text-base font-medium" style={{ color: getProgressColor() }}>{progress}%</span>
        </div>

        <div className="mb-4">
          <LinearProgress value={progress} color={getProgressColor()} />
        </div>

        <div className="flex min-h-[30px] flex-wrap gap-2 mb-4">
          {roadmap.isActive && <ActiveBadge />}
          {roadmap.isShared && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">
              <Globe2 className="h-3 w-3" />
              Shared
            </span>
          )}
          {progress === 100 ? (
            <StatusChip status="completed" count={0} label="Completed" />
          ) : progress > 0 || hasInProgress ? (
            <StatusChip status="in-progress" count={roadmap.inProgressCount} label="In Progress" />
          ) : (
            <StatusChip status="not-started" count={0} label="Not Started" />
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--md3-outline-variant)]">
        <span className="text-xs text-[var(--md3-on-surface-variant)]">
          {readonly && roadmap.ownerName ? `By ${roadmap.ownerName}` : new Date(roadmap.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          {!readonly && (
            <ToggleSwitch
              checked={roadmap.isActive}
              disabled={activating || sharing}
              loading={activating}
              label="Active"
              loadingLabel="Updating..."
              activeTone="success"
              aria-label={roadmap.isActive ? 'Deactivate roadmap' : 'Activate roadmap'}
              onChange={onActivate}
            />
          )}
          {readonly && (
            <ActionButton icon={Copy} label={copying ? 'Copying...' : 'Copy'} variant="primary" onClick={onCopy} disabled={copying} />
          )}
          <ActionLink icon={FolderOpen} label="Open" to={readonly ? `/shared-roadmap/${roadmap.id}` : `/roadmap/${roadmap.id}`} />
        </div>
      </div>

      <div className="mt-3 flex min-h-[26px] flex-wrap gap-1">
        {roadmap.tags && roadmap.tags.length > 0 ? roadmap.tags.map((tag) => (
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
        )) : (
          <span className="text-xs text-transparent">No tags</span>
        )}
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

interface CreatePersonalRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  careerRoles: CareerRole[];
  technicalSkills: TechnicalSkillDto[];
  rolesLoading: boolean;
  profileId: string;
  onCreate: (dto: CreatePersonalRoadmapDto) => void;
  creating: boolean;
}

interface CreateStepDraft {
  name: string;
  description: string;
  connectionType: 'learning' | 'branch';
  previousStepIndex: string;
  branchStepIndex: string;
  positionX: string;
  positionY: string;
  technicalSkillIds: string[];
  learningResources: Array<{
    name: string;
    resourceUrl: string;
    resourceType: string;
    provider: string;
    isFree: boolean;
  }>;
}

function CreatePersonalRoadmapModal({ isOpen, onClose, careerRoles, technicalSkills, rolesLoading, profileId, onCreate, creating }: CreatePersonalRoadmapModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [desire, setDesire] = useState('');
  const [careerRoleId, setCareerRoleId] = useState('');
  const [steps, setSteps] = useState<CreateStepDraft[]>([
    { name: '', description: '', connectionType: 'learning', previousStepIndex: '', branchStepIndex: '', positionX: '', positionY: '', technicalSkillIds: [], learningResources: [] },
    { name: '', description: '', connectionType: 'learning', previousStepIndex: '', branchStepIndex: '', positionX: '', positionY: '', technicalSkillIds: [], learningResources: [] },
    { name: '', description: '', connectionType: 'learning', previousStepIndex: '', branchStepIndex: '', positionX: '', positionY: '', technicalSkillIds: [], learningResources: [] },
  ]);

  if (!isOpen) return null;

  const validSteps = steps
    .map((step) => ({
      name: step.name.trim(),
      description: step.description.trim() || undefined,
      previousStepIndex: step.connectionType === 'learning' && step.previousStepIndex !== '' ? Number(step.previousStepIndex) : undefined,
      branchStepIndex: step.connectionType === 'branch' && step.branchStepIndex !== '' ? Number(step.branchStepIndex) : undefined,
      positionX: step.positionX.trim() === '' ? undefined : Number(step.positionX),
      positionY: step.positionY.trim() === '' ? undefined : Number(step.positionY),
      technicalSkillIds: step.technicalSkillIds,
      learningResources: step.learningResources
        .map((resource) => ({
          name: resource.name.trim(),
          resourceUrl: resource.resourceUrl.trim(),
          resourceType: resource.resourceType.trim() || 'Article',
          provider: resource.provider.trim() || undefined,
          isFree: resource.isFree,
        }))
        .filter((resource) => resource.name && resource.resourceUrl),
    }))
    .filter((step) => step.name.length > 0);
  const hasInvalidBranch = steps.some((step, index) =>
    step.name.trim() && index > 0 && step.connectionType === 'branch' && step.branchStepIndex === '',
  );
  const canCreate = profileId && careerRoleId && name.trim() && validSteps.length > 0 && !hasInvalidBranch && !creating;

  const updateStep = <TKey extends keyof CreateStepDraft>(index: number, field: TKey, value: CreateStepDraft[TKey]) => {
    setSteps((current) => current.map((step, i) => i === index ? { ...step, [field]: value } : step));
  };

  const addStep = () => setSteps((current) => [...current, { name: '', description: '', connectionType: 'learning', previousStepIndex: '', branchStepIndex: '', positionX: '', positionY: '', technicalSkillIds: [], learningResources: [] }]);
  const removeStep = (index: number) => setSteps((current) => current.filter((_, i) => i !== index));
  const addStepResource = (stepIndex: number) => {
    setSteps((current) => current.map((step, i) => i === stepIndex
      ? {
          ...step,
          learningResources: [
            ...step.learningResources,
            { name: '', resourceUrl: '', resourceType: 'Article', provider: '', isFree: true },
          ],
        }
      : step));
  };
  const updateStepResource = <TKey extends keyof CreateStepDraft['learningResources'][number]>(
    stepIndex: number,
    resourceIndex: number,
    field: TKey,
    value: CreateStepDraft['learningResources'][number][TKey],
  ) => {
    setSteps((current) => current.map((step, i) => i === stepIndex
      ? {
          ...step,
          learningResources: step.learningResources.map((resource, rIndex) =>
            rIndex === resourceIndex ? { ...resource, [field]: value } : resource,
          ),
        }
      : step));
  };
  const removeStepResource = (stepIndex: number, resourceIndex: number) => {
    setSteps((current) => current.map((step, i) => i === stepIndex
      ? { ...step, learningResources: step.learningResources.filter((_, rIndex) => rIndex !== resourceIndex) }
      : step));
  };
  const toggleStepSkill = (stepIndex: number, skillId: string) => {
    setSteps((current) => current.map((step, i) => {
      if (i !== stepIndex) return step;
      const selected = step.technicalSkillIds.includes(skillId);
      return {
        ...step,
        technicalSkillIds: selected
          ? step.technicalSkillIds.filter((id) => id !== skillId)
          : [...step.technicalSkillIds, skillId],
      };
    }));
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      profileId,
      careerRoleId,
      name: name.trim(),
      description: description.trim() || undefined,
      desire: desire.trim() || undefined,
      steps: validSteps,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={creating ? undefined : onClose} />
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-[720px] flex-col rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--md3-outline-variant)] p-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">Create Personal Roadmap</h2>
            <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">Shape a learning path around your own goal and steps.</p>
          </div>
          <button
            onClick={onClose}
            disabled={creating}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Roadmap name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={160}
                className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)] focus:ring-2 focus:ring-[var(--md3-primary)]/20"
                placeholder="My backend mastery path"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Related role</span>
              <select
                value={careerRoleId}
                onChange={(e) => setCareerRoleId(e.target.value)}
                className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)] focus:ring-2 focus:ring-[var(--md3-primary)]/20"
                disabled={rolesLoading}
              >
                <option value="">{rolesLoading ? 'Loading roles...' : 'Select a role'}</option>
                {careerRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={240}
              className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)] focus:ring-2 focus:ring-[var(--md3-primary)]/20"
              placeholder="Short summary for your path"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Your desire or goal</span>
            <textarea
              value={desire}
              onChange={(e) => setDesire(e.target.value)}
              maxLength={1000}
              className="h-24 w-full resize-none rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)] focus:ring-2 focus:ring-[var(--md3-primary)]/20"
              placeholder="What are you trying to become or build?"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--md3-on-surface)]">Learning steps</span>
              <ActionButton icon={Plus} label="Add Step" variant="text" size="sm" onClick={addStep} />
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="rounded-xl border border-[var(--md3-outline-variant)] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--md3-primary-container)] text-xs font-semibold text-[var(--md3-primary)]">{index + 1}</span>
                    <input
                      value={step.name}
                      onChange={(e) => updateStep(index, 'name', e.target.value)}
                      maxLength={140}
                      className="min-w-0 flex-1 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                      placeholder="Step title"
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]"
                        onClick={() => removeStep(index)}
                        aria-label="Remove step"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    maxLength={500}
                    className="h-16 w-full resize-none rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                    placeholder="Optional step details"
                  />
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">X-axis</span>
                      <input
                        type="number"
                        value={step.positionX}
                        onChange={(e) => updateStep(index, 'positionX', e.target.value)}
                        min={0}
                        max={1400}
                        step={10}
                        className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                        placeholder={String(index % 2 === 0 ? 540 : 180)}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Y-axis</span>
                      <input
                        type="number"
                        value={step.positionY}
                        onChange={(e) => updateStep(index, 'positionY', e.target.value)}
                        min={0}
                        max={2000}
                        step={10}
                        className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                        placeholder={String(80 + index * 160)}
                      />
                    </label>
                  </div>
                  {index > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => updateStep(index, 'connectionType', 'learning')}
                          className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                            step.connectionType === 'learning'
                              ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-on-primary-container)]'
                              : 'border-[var(--md3-outline)] text-[var(--md3-on-surface)] hover:bg-[var(--md3-surface-variant)]'
                          }`}
                        >
                          Learning Step
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStep(index, 'connectionType', 'branch')}
                          className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                            step.connectionType === 'branch'
                              ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-on-primary-container)]'
                              : 'border-[var(--md3-outline)] text-[var(--md3-on-surface)] hover:bg-[var(--md3-surface-variant)]'
                          }`}
                        >
                          Branch Node
                        </button>
                      </div>
                      {step.connectionType === 'learning' ? (
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Arrow from</span>
                          <select
                            value={step.previousStepIndex}
                            onChange={(e) => updateStep(index, 'previousStepIndex', e.target.value)}
                            className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                          >
                            <option value="">Previous learning step</option>
                            {steps.slice(0, index).map((candidate, candidateIndex) => (
                              <option key={candidateIndex} value={candidateIndex}>
                                Step {candidateIndex + 1}{candidate.name.trim() ? ` - ${candidate.name.trim()}` : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Dashed branch from</span>
                          <select
                            value={step.branchStepIndex}
                            onChange={(e) => updateStep(index, 'branchStepIndex', e.target.value)}
                            className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                          >
                            <option value="">Select branch source</option>
                            {steps.slice(0, index).map((candidate, candidateIndex) => (
                              <option key={candidateIndex} value={candidateIndex}>
                                Step {candidateIndex + 1}{candidate.name.trim() ? ` - ${candidate.name.trim()}` : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  )}

                  {technicalSkills.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Skills</p>
                      <SkillSearchPicker
                        skills={technicalSkills}
                        selectedSkillIds={step.technicalSkillIds}
                        onToggle={(skillId) => toggleStepSkill(index, skillId)}
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">Learning resources</p>
                      <ActionButton icon={Plus} label="Add Resource" variant="text" size="sm" onClick={() => addStepResource(index)} />
                    </div>
                    <div className="space-y-2">
                      {step.learningResources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} className="rounded-lg border border-[var(--md3-outline-variant)] p-2">
                          <div className="mb-2 flex items-center gap-2">
                            <input
                              value={resource.name}
                              onChange={(e) => updateStepResource(index, resourceIndex, 'name', e.target.value)}
                              className="min-w-0 flex-1 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                              placeholder="Resource name"
                            />
                            <button
                              type="button"
                              onClick={() => removeStepResource(index, resourceIndex)}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--md3-error)] hover:bg-[var(--md3-error-container)]"
                              aria-label="Remove resource"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <input
                            value={resource.resourceUrl}
                            onChange={(e) => updateStepResource(index, resourceIndex, 'resourceUrl', e.target.value)}
                            className="mb-2 w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                            placeholder="https://..."
                          />
                          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                            <input
                              value={resource.resourceType}
                              onChange={(e) => updateStepResource(index, resourceIndex, 'resourceType', e.target.value)}
                              className="rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                              placeholder="Article"
                            />
                            <input
                              value={resource.provider}
                              onChange={(e) => updateStepResource(index, resourceIndex, 'provider', e.target.value)}
                              className="rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                              placeholder="Provider"
                            />
                            <label className="flex items-center gap-2 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={resource.isFree}
                                onChange={(e) => updateStepResource(index, resourceIndex, 'isFree', e.target.checked)}
                              />
                              Free
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ActionButton
              icon={Plus}
              label="Add Step"
              variant="tonal"
              size="md"
              onClick={addStep}
              className="mt-3 w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--md3-outline-variant)] p-6">
          <ActionButton icon={X} label="Cancel" variant="text" onClick={onClose} disabled={creating} />
          <ActionButton
            icon={Plus}
            label={creating ? 'Creating...' : 'Create Roadmap'}
            variant="primary"
            size="md"
            onClick={handleCreate}
            disabled={!canCreate}
          />
        </div>
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
