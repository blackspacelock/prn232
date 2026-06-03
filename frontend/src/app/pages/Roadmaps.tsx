import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { GenerateRoadmapModal } from '../components/GenerateRoadmapModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LinearProgress } from '../components/LinearProgress';
import { StatusChip } from '../components/StatusChip';
import { ActionButton, ActionLink } from '../components/ActionButton';
import { FolderOpen, MoreVertical, Rocket, Search, Trash2 } from 'lucide-react';

const initialRoadmaps = [
  {
    id: 1,
    title: 'Frontend Developer',
    progress: 75,
    current: 18,
    total: 24,
    done: 6,
    inProgress: 3,
    skipped: 2,
    created: 'Jun 1, 2026',
  },
  {
    id: 2,
    title: 'Backend Developer',
    progress: 30,
    current: 7,
    total: 24,
    done: 2,
    inProgress: 1,
    skipped: 0,
    created: 'Jun 15, 2026',
  },
  {
    id: 3,
    title: 'DevOps Engineer',
    progress: 0,
    current: 0,
    total: 24,
    done: 0,
    inProgress: 0,
    skipped: 0,
    created: 'Jun 20, 2026',
  },
];

export function RoadmapsPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleGenerate = (roleId: number, note: string) => {
    console.log('Generating roadmap for role:', roleId, 'with note:', note);
    // Navigate to the newly created roadmap
    navigate('/roadmap/1');
  };

  return (
    <AppShell breadcrumb="Roadmaps">
      <div className="app-page">
        <PageHeader
          title="My Roadmaps"
          description="Track and manage your personalized learning paths."
          actions={
            <ActionButton
              icon={Rocket}
              label="Generate Roadmap"
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
            />
          }
        />

        {/* Filter Bar */}
        <div className="md3-panel flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search roadmaps..."
              className="md3-field w-full pl-12 pr-4"
            />
          </div>
          <FilterChip label="All" active />
          <FilterChip label="In Progress" />
          <FilterChip label="Completed" />
        </div>

        {/* Roadmap Cards */}
        {roadmaps.length > 0 ? (
          <div className="desktop-grid-3">
            {roadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} {...roadmap} onDelete={() => setDeleteId(roadmap.id)} />
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

        {/* Floating Action Button */}
        <ActionButton
          icon={Rocket}
          label="Generate Roadmap"
          variant="primary"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 shadow-lg"
          style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' }}
        />

        {/* Generate Roadmap Modal */}
        <GenerateRoadmapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGenerate={handleGenerate}
        />

        <ConfirmDialog
          isOpen={deleteId !== null}
          title="Delete Roadmap?"
          message="This roadmap will be removed from your list. Your account and profile data are not affected."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            if (deleteId !== null) {
              setRoadmaps(roadmaps.filter((roadmap) => roadmap.id !== deleteId));
              setDeleteId(null);
            }
          }}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AppShell>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
        active
          ? 'md3-chip-selected'
          : 'bg-[var(--md3-surface-variant)] border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] hover:border-[var(--md3-on-surface-variant)]'
      }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

interface RoadmapCardProps {
  id: number;
  title: string;
  progress: number;
  current: number;
  total: number;
  done: number;
  inProgress: number;
  skipped: number;
  created: string;
  onDelete: () => void;
}

function RoadmapCard({ id, title, progress, current, total, done, inProgress, skipped, created, onDelete }: RoadmapCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const getProgressColor = () => {
    if (progress >= 70) return 'var(--md3-success)';
    if (progress >= 30) return 'var(--md3-primary)';
    return 'var(--md3-on-surface-variant)';
  };

  return (
    <div className="md3-card relative p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-medium text-[var(--md3-on-surface)]">{title}</h3>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)] hover:text-[var(--md3-on-surface)]"
          aria-label="Roadmap actions"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-14 z-10 min-w-36 rounded-xl border border-[var(--md3-outline-variant)] bg-white p-1 shadow-lg">
            <ActionButton
              icon={Trash2}
              label="Delete"
              variant="danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full justify-start rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--md3-on-surface-variant)]">
          {current} / {total} nodes
        </span>
        <span className="text-base font-medium" style={{ color: getProgressColor() }}>
          {progress}%
        </span>
      </div>

      <div className="mb-4">
        <LinearProgress value={progress} color={getProgressColor()} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {done > 0 && (
          <StatusChip
            status="completed"
            count={done}
            label="Done"
          />
        )}
        {inProgress > 0 && (
          <StatusChip
            status="in-progress"
            count={inProgress}
            label="In Progress"
          />
        )}
        {skipped > 0 && (
          <StatusChip
            status="skipped"
            count={skipped}
            label="Skipped"
          />
        )}
        {current === 0 && (
          <StatusChip
            status="not-started"
            count={total}
            label="Not Started"
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--md3-outline-variant)]">
        <span className="text-xs text-[var(--md3-on-surface-variant)]">Created {created}</span>
        <ActionLink
          icon={FolderOpen}
          label="Open"
          to={`/roadmap/${id}`}
        />
      </div>
    </div>
  );
}
