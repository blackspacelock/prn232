import { ArrowRight, BookOpen, GitBranch, Hash, LogIn, Rocket, Sparkles, X } from 'lucide-react';
import { Skeleton } from '../Skeleton';
import { ActionButton, ActionLink } from '../ActionButton';
import { RoadmapResourceCard } from './RoadmapResourceCard';
import type { LearningResourceDto, NodeDto, RoadmapNodeDto } from '@/types/api';

interface RoadmapTemplateInspectorProps {
  selectedNode: NodeDto | null;
  selectedRoadmapNode?: RoadmapNodeDto | null;
  resources: LearningResourceDto[];
  resourcesLoading: boolean;
  isAuthenticated: boolean;
  generating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onClose: () => void;
}

export function RoadmapTemplateInspector({
  selectedNode,
  selectedRoadmapNode,
  resources,
  resourcesLoading,
  isAuthenticated,
  generating,
  canGenerate,
  onGenerate,
  onClose,
}: RoadmapTemplateInspectorProps) {
  return (
    <aside className="w-full border-l border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] shadow-xl md:w-[420px]">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-[var(--md3-outline-variant)] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-[var(--md3-on-surface)]">
                {selectedNode?.name ?? 'Roadmap Template'}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--md3-status-in-progress-stroke)] bg-[var(--md3-primary-container)] px-2 py-1 text-xs font-medium text-[var(--md3-primary)]">
                  <GitBranch className="h-3.5 w-3.5" />
                  Template
                </span>
                {selectedNode && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                    <Hash className="h-3.5 w-3.5" />
                    {selectedRoadmapNode?.order ?? selectedNode.order}
                  </span>
                )}
                {selectedRoadmapNode?.requirementType && (
                  <span className="inline-flex items-center rounded-md border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                    {selectedRoadmapNode.requirementType}
                  </span>
                )}
              </div>
            </div>
            {selectedNode && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--md3-surface-variant)]"
                aria-label="Close node details"
              >
                <X className="h-5 w-5 text-[var(--md3-on-surface-variant)]" />
              </button>
            )}
          </div>
          {selectedNode?.description && (
            <p className="mt-4 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
              {selectedNode.description}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <section className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
                Technical Skills
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--md3-on-surface-variant)]">
                <Sparkles className="h-3.5 w-3.5" />
                {selectedNode?.technicalSkills.length ?? 0}
              </span>
            </div>
            {!selectedNode ? (
              <p className="text-sm text-[var(--md3-on-surface-variant)]">
                Select a node to inspect its required skills.
              </p>
            ) : selectedNode.technicalSkills.length === 0 ? (
              <p className="text-sm text-[var(--md3-on-surface-variant)]">
                No technical skills are attached to this node yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedNode.technicalSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex rounded-md border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] px-2.5 py-1 text-xs font-medium text-[var(--md3-on-surface)]"
                    title={skill.category}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
                Learning Resources
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--md3-on-surface-variant)]">
                <BookOpen className="h-3.5 w-3.5" />
                {selectedNode ? resources.length : 0}
              </span>
            </div>
            {!selectedNode ? (
              <p className="text-sm text-[var(--md3-on-surface-variant)]">
                Select a node to inspect its learning resources.
              </p>
            ) : resourcesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <p className="text-sm text-[var(--md3-on-surface-variant)]">
                No resources are attached to this node yet.
              </p>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <RoadmapResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </section>

          {isAuthenticated ? (
            <section className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
              <p className="mb-3 text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
                Start Roadmap
              </p>
              <p className="mb-4 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
                Generate a personal roadmap from this template to track progress and notes.
              </p>
              <ActionButton
                icon={Rocket}
                label={generating ? 'Generating...' : 'Generate My Roadmap'}
                variant="primary"
                size="lg"
                onClick={onGenerate}
                disabled={generating || !canGenerate}
                className="w-full"
              />
            </section>
          ) : (
            <section className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
              <p className="mb-3 text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
                Start Roadmap
              </p>
              <p className="mb-4 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
                Sign in or create an account to generate this as a personal roadmap.
              </p>
              <div className="flex flex-col gap-3">
                <ActionLink icon={LogIn} label="Sign in" to="/login" variant="tonal" size="md" />
                <ActionLink
                  icon={ArrowRight}
                  label="Create account"
                  to="/register"
                  variant="primary"
                  size="md"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
