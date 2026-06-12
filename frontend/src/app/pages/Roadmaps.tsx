import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LinearProgress } from '../components/LinearProgress';
import { StatusChip } from '../components/StatusChip';
import { ActionButton, ActionLink } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { FolderOpen, MoreVertical, Rocket, Search, Trash2 } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { apolloClient } from '@/lib/apollo';
import {
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
  GET_CAREER_ROLES,
  GET_CAREER_ROADMAPS_BY_ROLE,
} from '@/graphql/queries';
import type { GeneratePersonalRoadmapRequestDto } from '@/types/api';

interface CareerRole { id: string; name: string; description?: string }
interface CareerRoadmap { id: string; name: string; description?: string }
interface PersonalRoadmap {
  id: string;
  profileId: string;
  careerRoadmapId: string;
  note?: string;
  progressPercentage: number;
  createdAt: string;
}

export function RoadmapsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });

  const { data: roadmapsData, loading: roadmapsLoading, error: roadmapsError, refetch: refetchRoadmaps } = useQuery(GET_PERSONAL_ROADMAPS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const { data: rolesData, loading: rolesLoading } = useQuery(GET_CAREER_ROLES);
  const [loadRoadmapsByRole, { data: roadmapsByRoleData, loading: roadmapsByRoleLoading }] = useLazyQuery(GET_CAREER_ROADMAPS_BY_ROLE);

  const allRoadmaps: PersonalRoadmap[] = (roadmapsData as { personalRoadmapsByProfile?: PersonalRoadmap[] })?.personalRoadmapsByProfile ?? [];
  const roadmaps = searchQuery
    ? allRoadmaps.filter((r) =>
        new Date(r.createdAt).toLocaleDateString().includes(searchQuery) ||
        (r.note ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allRoadmaps;
  const careerRoles: CareerRole[] = (rolesData as { careerRoles?: CareerRole[] })?.careerRoles ?? [];
  const careerRoadmaps: CareerRoadmap[] = (roadmapsByRoleData as { careerRoadmapsByRole?: CareerRoadmap[] })?.careerRoadmapsByRole ?? [];

  const generateMutation = useMutation({
    mutationFn: (dto: GeneratePersonalRoadmapRequestDto) =>
      apiClient.post<{ id: string }>('/api/personal-roadmaps/generate', dto).then((r) => r.data),
    onSuccess: async (data) => {
      await apolloClient.refetchQueries({ include: [GET_PERSONAL_ROADMAPS_BY_PROFILE] });
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
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_PERSONAL_ROADMAPS_BY_PROFILE] });
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete roadmap.';
      showError(msg);
      setDeleteId(null);
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

        <div className="md3-panel flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roadmaps..."
              className="md3-field w-full pl-12 pr-4"
            />
          </div>
        </div>

        {roadmaps.length > 0 ? (
          <div className="desktop-grid-3">
            {roadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} onDelete={() => setDeleteId(roadmap.id)} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Rocket}
            title="No roadmaps yet"
            description="Generate a personalized roadmap from an available career role to begin tracking your progress."
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

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
      </div>
    </AppShell>
  );
}

function RoadmapCard({ roadmap, onDelete }: { roadmap: PersonalRoadmap; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.round(roadmap.progressPercentage);
  const getProgressColor = () => {
    if (progress >= 70) return 'var(--md3-success)';
    if (progress >= 30) return 'var(--md3-primary)';
    return 'var(--md3-on-surface-variant)';
  };

  return (
    <div className="md3-card relative p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-medium text-[var(--md3-on-surface)]">Roadmap</h3>
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]" aria-label="Roadmap actions">
          <MoreVertical className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-14 z-10 min-w-36 rounded-xl border border-[var(--md3-outline-variant)] bg-white p-1 shadow-lg">
            <ActionButton icon={Trash2} label="Delete" variant="danger" onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full justify-start rounded-lg" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--md3-on-surface-variant)]">Progress</span>
        <span className="text-base font-medium" style={{ color: getProgressColor() }}>{progress}%</span>
      </div>

      <div className="mb-4">
        <LinearProgress value={progress} color={getProgressColor()} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {progress === 100 ? (
          <StatusChip status="completed" count={0} label="Completed" />
        ) : progress > 0 ? (
          <StatusChip status="in-progress" count={0} label="In Progress" />
        ) : (
          <StatusChip status="not-started" count={0} label="Not Started" />
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--md3-outline-variant)]">
        <span className="text-xs text-[var(--md3-on-surface-variant)]">
          {new Date(roadmap.createdAt).toLocaleDateString()}
        </span>
        <ActionLink icon={FolderOpen} label="Open" to={`/roadmap/${roadmap.id}`} />
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
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-4">Generate Roadmap</h2>
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
