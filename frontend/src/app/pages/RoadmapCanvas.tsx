import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Snackbar } from '../components/Snackbar';
import { ActionButton } from '../components/ActionButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NodeStatusPicker } from '../components/NodeStatusPicker';
import { SkillSearchPicker } from '../components/SkillSearchPicker';
import { Copy, Plus, Trash2, X, Save, Settings } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { NODE_STATUS_COLORS, type NodeStatusInt } from '@/constants/nodeStatus';
import { RoadmapCanvasHeader } from '../components/roadmap/RoadmapCanvasHeader';
import { RoadmapGraphCanvas, type RoadmapGraphNode } from '../components/roadmap/RoadmapGraphCanvas';
import { RoadmapResourceCard } from '../components/roadmap/RoadmapResourceCard';
import {
  GET_CAREER_ROADMAP_WITH_NODES,
  GET_PERSONAL_ROADMAP_WITH_PROGRESS,
  GET_SHARED_PERSONAL_ROADMAP_WITH_PROGRESS,
  GET_NODE_PROGRESS,
  GET_LEARNING_RESOURCES_BY_NODE,
  GET_RECOMMENDED_RESOURCES,
  GET_TECHNICAL_SKILLS,
} from '@/graphql/queries';
import type {
  CareerRoadmapWithNodesDto,
  NodeProgressDto,
  PersonalRoadmapDetailDto,
  TechnicalSkillDto,
} from '@/types/api';

type ProgressNode = NodeProgressDto;

interface ResourceDraft {
  id?: string;
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider: string;
  isFree: boolean;
}

interface LearningResource {
  id: string;
  nodeId?: string;
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider?: string;
  isFree: boolean;
  createdAt?: string;
}

export function RoadmapCanvasPage() {
  return <RoadmapCanvasView shared={false} />;
}

export function SharedRoadmapCanvasPage() {
  return <RoadmapCanvasView shared />;
}

function RoadmapCanvasView({ shared }: { shared: boolean }) {
  const { id: personalRoadmapId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [selectedNodeProgress, setSelectedNodeProgress] = useState<ProgressNode | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<NodeStatusInt | null>(null);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [note, setNote] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [roadmapName, setRoadmapName] = useState('');
  const [roadmapDescription, setRoadmapDescription] = useState('');
  const [roadmapNote, setRoadmapNote] = useState('');
  const [showRoadmapSettings, setShowRoadmapSettings] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);
  const [localNodePositions, setLocalNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [resourceDrafts, setResourceDrafts] = useState<ResourceDraft[]>([]);
  const [deletedResourceIds, setDeletedResourceIds] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({
    open: false,
    message: '',
    variant: 'success',
  });

  const detailQuery = shared ? GET_SHARED_PERSONAL_ROADMAP_WITH_PROGRESS : GET_PERSONAL_ROADMAP_WITH_PROGRESS;
  const detailKey = shared ? 'sharedPersonalRoadmapWithProgress' : 'personalRoadmapWithProgress';

  const { data, loading, error, refetch } = useQuery(detailQuery, {
    variables: { personalRoadmapId },
    skip: !personalRoadmapId,
  });

  const { data: progressData, refetch: refetchProgress } = useQuery(GET_NODE_PROGRESS, {
    variables: { personalRoadmapId },
    skip: !personalRoadmapId || shared,
  });

  const { data: technicalSkillsData } = useQuery(GET_TECHNICAL_SKILLS, {
    skip: shared,
  });

  const [loadResources, { data: resourcesData, loading: resourcesLoading }] = useLazyQuery(GET_LEARNING_RESOURCES_BY_NODE);
  const [loadRecommended, { data: recommendedData }] = useLazyQuery(GET_RECOMMENDED_RESOURCES);

  const personalRoadmapProgressNodes: ProgressNode[] =
    (data as Record<string, { nodeProgresses?: ProgressNode[] } | undefined>)
      ?.[detailKey]?.nodeProgresses ?? [];
  const refreshedProgressNodes: ProgressNode[] =
    (progressData as { nodeProgress?: ProgressNode[] })?.nodeProgress ?? [];
  const progressNodes: ProgressNode[] =
    refreshedProgressNodes.length > 0 ? refreshedProgressNodes : personalRoadmapProgressNodes;
  const personalRoadmap = (data as Record<string, {
    careerRoadmapId?: string;
    careerRoadmapName?: string;
    careerRoadmapDescription?: string;
    isActive?: boolean;
    ownerName?: string;
    note?: string;
  } | undefined>)
    ?.[detailKey];
  const careerRoadmapId = personalRoadmap?.careerRoadmapId ?? '';

  const { data: templateData } = useQuery(GET_CAREER_ROADMAP_WITH_NODES, {
    variables: { roadmapId: careerRoadmapId },
    skip: !careerRoadmapId,
  });
  const template: CareerRoadmapWithNodesDto | null =
    (templateData as { careerRoadmapWithNodes?: CareerRoadmapWithNodesDto })
      ?.careerRoadmapWithNodes ?? null;
  const roadmapTitle = roadmapName || personalRoadmap?.careerRoadmapName || template?.name || 'Personal Roadmap';

  const summary: Array<{ status: number }> =
    (progressData as { nodeProgress?: Array<{ status: number }> })?.nodeProgress ?? [];
  const resources: LearningResource[] = useMemo(
    () => (resourcesData as { learningResourcesByNode?: LearningResource[] })?.learningResourcesByNode ?? [],
    [resourcesData],
  );
  const recommended: LearningResource[] = useMemo(
    () => (recommendedData as { recommendedResources?: LearningResource[] })?.recommendedResources ?? [],
    [recommendedData],
  );
  const technicalSkills: TechnicalSkillDto[] = useMemo(
    () => (technicalSkillsData as { technicalSkills?: TechnicalSkillDto[] })?.technicalSkills ?? [],
    [technicalSkillsData],
  );

  const graphNodes: RoadmapGraphNode[] = useMemo(
    () =>
      progressNodes.map((np) => {
        const localPosition = localNodePositions[np.roadmapNodeId];
        return {
          id: np.roadmapNodeId,
          nodeId: np.nodeId,
          parentRoadmapNodeId: np.roadmapNode.parentRoadmapNodeId,
          name: np.node.name,
          description: np.node.description,
          order: np.roadmapNode.order,
          nodeType: np.roadmapNode.nodeType,
          requirementType: np.roadmapNode.requirementType,
          positionX: localPosition?.x ?? np.roadmapNode.positionX,
          positionY: localPosition?.y ?? np.roadmapNode.positionY,
          status:
            selectedNodeProgress?.roadmapNodeId === np.roadmapNodeId && optimisticStatus !== null
              ? optimisticStatus
              : (np.status as NodeStatusInt),
        };
      }),
    [progressNodes, localNodePositions, selectedNodeProgress?.roadmapNodeId, optimisticStatus],
  );

  const saveStepMutation = useMutation({
    mutationFn: async () => {
      if (!selectedNodeProgress || optimisticStatus === null) {
        throw new Error('Select a roadmap step first.');
      }

      const incompleteResource = resourceDrafts.some((resource) => {
        const hasAnyValue = resource.name.trim() || resource.resourceUrl.trim() || resource.provider.trim();
        return hasAnyValue && (!resource.name.trim() || !resource.resourceUrl.trim());
      });
      if (incompleteResource) {
        throw new Error('Each learning resource needs at least a name and URL.');
      }

      await apiClient.put<ProgressNode>(`/api/node-progress/${selectedNodeProgress.id}/details`, {
        name: stepName,
        description: stepDescription,
        note,
        technicalSkillIds: selectedSkillIds,
      });

      const updatedProgress = await apiClient
        .put<ProgressNode>(`/api/node-progress/${selectedNodeProgress.id}/status`, {
          status: optimisticStatus,
          note: note || undefined,
        })
        .then((r) => r.data);

      await Promise.all(deletedResourceIds.map((resourceId) => apiClient.delete(`/api/learning-resources/${resourceId}`)));

      const resourcesToSave = resourceDrafts
        .map((resource) => ({
          ...resource,
          name: resource.name.trim(),
          resourceUrl: resource.resourceUrl.trim(),
          resourceType: resource.resourceType.trim() || 'Article',
          provider: resource.provider.trim() || undefined,
        }))
        .filter((resource) => resource.name && resource.resourceUrl);

      await Promise.all(resourcesToSave.map((resource) => {
        const dto = {
          name: resource.name,
          resourceUrl: resource.resourceUrl,
          resourceType: resource.resourceType,
          provider: resource.provider,
          isFree: resource.isFree,
        };

        return resource.id
          ? apiClient.put(`/api/learning-resources/${resource.id}`, dto)
          : apiClient.post(`/api/nodes/${selectedNodeProgress.nodeId}/learning-resources`, dto);
      }));

      await refetch();
      await refetchProgress();
      await loadResources({ variables: { nodeId: selectedNodeProgress.nodeId } });
      return updatedProgress;
    },
    onSuccess: (updatedProgress) => {
      setDeletedResourceIds([]);
      setSelectedNodeProgress((current) =>
        current && current.id === updatedProgress.id
          ? {
              ...current,
              ...updatedProgress,
              roadmapNode: updatedProgress.roadmapNode ?? current.roadmapNode,
              node: updatedProgress.node ?? current.node,
            }
          : current,
      );
      setOptimisticStatus(updatedProgress.status as NodeStatusInt);
      setSnackbar({ open: true, message: 'Roadmap step updated.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      setSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to update roadmap step.'),
        variant: 'error',
      });
    },
  });

  const copySharedMutation = useMutation({
    mutationFn: () =>
      apiClient.post<PersonalRoadmapDetailDto>(`/api/personal-roadmaps/shared/${personalRoadmapId}/copy`, { profileId }).then((r) => r.data),
    onSuccess: (copied) => {
      navigate(`/roadmap/${copied.id}`);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      setSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to copy shared roadmap.'),
        variant: 'error',
      });
    },
  });

  const updateRoadmapMutation = useMutation({
    mutationFn: () =>
      apiClient.put<PersonalRoadmapDetailDto>(`/api/personal-roadmaps/${personalRoadmapId}`, {
        name: roadmapName,
        description: roadmapDescription,
        note: roadmapNote,
      }).then((r) => r.data),
    onSuccess: async (updated) => {
      setRoadmapName(updated.careerRoadmapName);
      setRoadmapDescription(updated.careerRoadmapDescription ?? '');
      setRoadmapNote(updated.note ?? '');
      setShowRoadmapSettings(false);
      await refetch();
      setSnackbar({ open: true, message: 'Roadmap details updated.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      setSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to update roadmap details.'),
        variant: 'error',
      });
    },
  });

  const addStepMutation = useMutation({
    mutationFn: (dto: AddStepDraft) =>
      apiClient.post<PersonalRoadmapDetailDto>(`/api/personal-roadmaps/${personalRoadmapId}/steps`, dto).then((r) => r.data),
    onSuccess: async () => {
      setShowAddStep(false);
      await refetch();
      await refetchProgress();
      setSnackbar({ open: true, message: 'Roadmap step added.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      setSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to add roadmap step.'),
        variant: 'error',
      });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (roadmapNodeId: string) =>
      apiClient.delete(`/api/personal-roadmaps/${personalRoadmapId}/steps/${roadmapNodeId}`),
    onSuccess: async () => {
      setSelectedNodeProgress(null);
      setDeleteStepId(null);
      await refetch();
      await refetchProgress();
      setSnackbar({ open: true, message: 'Roadmap step deleted.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      setSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to delete roadmap step.'),
        variant: 'error',
      });
      setDeleteStepId(null);
    },
  });

  const updateStepPositionMutation = useMutation({
    mutationFn: ({ roadmapNodeId, x, y }: { roadmapNodeId: string; x: number; y: number; previous?: { x?: number; y?: number } }) =>
      apiClient.put(`/api/personal-roadmaps/${personalRoadmapId}/steps/${roadmapNodeId}/position`, {
        positionX: x,
        positionY: y,
      }),
    onError: (error: unknown, variables) => {
      setLocalNodePositions((current) => {
        const next = { ...current };
        if (typeof variables.previous?.x === 'number' && typeof variables.previous?.y === 'number') {
          next[variables.roadmapNodeId] = {
            x: variables.previous.x,
            y: variables.previous.y,
          };
        } else {
          delete next[variables.roadmapNodeId];
        }
        return next;
      });
      const msg = (error as { response?: { data?: string | { message?: string } } })?.response?.data;
      setSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : (msg?.message ?? 'Failed to update roadmap step position.'),
        variant: 'error',
      });
    },
  });

  const handleNodeSelect = useCallback((node: RoadmapGraphNode) => {
    const np = progressNodes.find((p) => p.roadmapNodeId === node.id);
    if (np) {
      setSelectedNodeProgress(np);
      setOptimisticStatus(np.status as NodeStatusInt);
      setStepName(np.node.name);
      setStepDescription(np.node.description ?? '');
      setNote(np.note ?? '');
      setSelectedSkillIds(np.node.technicalSkills.map((skill) => skill.id));
      setResourceDrafts([]);
      setDeletedResourceIds([]);
      loadResources({ variables: { nodeId: np.nodeId } });
      if (!shared && profileId) {
        loadRecommended({ variables: { profileId, nodeId: np.nodeId } });
      }
    }
  }, [progressNodes, profileId, loadResources, loadRecommended, shared]);

  const handleStatusChange = (newStatus: NodeStatusInt) => {
    setOptimisticStatus(newStatus);
  };

  const handleSave = () => {
    if (!selectedNodeProgress || optimisticStatus === null) return;
    saveStepMutation.mutate();
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  };

  const addResourceDraft = () => {
    setResourceDrafts((current) => [
      ...current,
      { name: '', resourceUrl: '', resourceType: 'Article', provider: '', isFree: true },
    ]);
  };

  const updateResourceDraft = <TKey extends keyof ResourceDraft>(index: number, field: TKey, value: ResourceDraft[TKey]) => {
    setResourceDrafts((current) => current.map((resource, i) => i === index ? { ...resource, [field]: value } : resource));
  };

  const removeResourceDraft = (index: number) => {
    setResourceDrafts((current) => {
      const resource = current[index];
      if (resource?.id) {
        setDeletedResourceIds((ids) => [...ids, resource.id!]);
      }
      return current.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    if (!selectedNodeProgress) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setResourceDrafts(resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        resourceUrl: resource.resourceUrl,
        resourceType: resource.resourceType || 'Article',
        provider: resource.provider ?? '',
        isFree: resource.isFree,
      })));
      setDeletedResourceIds([]);
    });

    return () => {
      cancelled = true;
    };
  }, [resources, selectedNodeProgress]);

  useEffect(() => {
    if (!personalRoadmap) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setRoadmapName(personalRoadmap.careerRoadmapName ?? template?.name ?? '');
      setRoadmapDescription(personalRoadmap.careerRoadmapDescription ?? template?.description ?? '');
      setRoadmapNote(personalRoadmap.note ?? '');
    });

    return () => {
      cancelled = true;
    };
  }, [personalRoadmap, template?.name, template?.description]);

  const summaryNodes = summary.length > 0 ? summary : progressNodes;
  const completedCount = summaryNodes.filter((n: { status: number }) => n.status === 4).length;
  const totalCount = summaryNodes.length;

  if (loading) {
    return (
      <AppShell breadcrumb="Roadmap Canvas" className="app-main--flush">
        <Skeleton className="flex-1" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell breadcrumb="Roadmap Canvas">
        <EmptyState icon={X} title="Failed to load roadmap" description="Please try again." actionLabel="Retry" onAction={refetch} />
      </AppShell>
    );
  }

  const currentColors = optimisticStatus !== null ? NODE_STATUS_COLORS[optimisticStatus] : NODE_STATUS_COLORS[0];

  return (
    <AppShell
      breadcrumb="Roadmaps / Canvas"
      breadcrumbs={[
        { label: shared ? 'Shared Roadmaps' : 'Roadmaps', to: '/roadmaps' },
        { label: roadmapTitle },
      ]}
      showProgress={totalCount > 0 ? { current: completedCount, total: totalCount, percentage: Math.round((completedCount / totalCount) * 100) } : undefined}
      className="app-main--flush"
    >
      <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row">
        <div className="relative min-h-[520px] flex-1 overflow-hidden bg-[#fafafa]">
            <RoadmapCanvasHeader
              title={roadmapTitle}
              description={roadmapDescription || template?.description}
              nodeCount={graphNodes.length}
              isActive={shared ? undefined : personalRoadmap?.isActive}
              progress={{ completed: completedCount, total: totalCount }}
            />
          {!shared && (
            <div className="absolute right-5 top-5 z-10 flex gap-2">
              <ActionButton icon={Settings} label="Roadmap Details" variant="neutral" size="sm" onClick={() => setShowRoadmapSettings(true)} />
              <ActionButton icon={Plus} label="Add Step" variant="primary" size="sm" onClick={() => setShowAddStep(true)} />
            </div>
          )}
          <RoadmapGraphCanvas
            graphNodes={graphNodes}
            graphEdges={template?.edges}
            selectedNodeId={selectedNodeProgress?.roadmapNodeId}
            useStatusColors
            onNodeSelect={handleNodeSelect}
            onNodePositionChange={(roadmapNodeId, position) => {
              if (shared) return;
              const graphNode = graphNodes.find((node) => node.id === roadmapNodeId);
              const previous = {
                x: graphNode?.positionX,
                y: graphNode?.positionY,
              };
              if (previous.x === position.x && previous.y === position.y) return;

              setLocalNodePositions((current) => ({
                ...current,
                [roadmapNodeId]: {
                  x: position.x,
                  y: position.y,
                },
              }));
              updateStepPositionMutation.mutate({
                roadmapNodeId,
                x: position.x,
                y: position.y,
                previous,
              });
            }}
          />
        </div>

        {selectedNodeProgress && (
          <div className="flex w-full flex-col overflow-hidden border-l border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] shadow-xl md:w-[420px]">
            <div className="border-b border-[var(--md3-outline-variant)] bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-[var(--md3-on-surface)]">{stepName || selectedNodeProgress.node.name}</h2>
                  <span
                    className="mt-3 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                    style={{ background: currentColors.fill, color: currentColors.text, border: `1px solid ${currentColors.stroke}` }}
                  >
                    {currentColors.label}
                  </span>
                </div>
                <button onClick={() => setSelectedNodeProgress(null)} className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {shared ? (
                <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                  <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Shared by</p>
                  <p className="text-sm text-[var(--md3-on-surface)]">{personalRoadmap?.ownerName ?? 'SE Compass learner'}</p>
                  {personalRoadmap?.note && <p className="mt-2 text-sm text-[var(--md3-on-surface-variant)]">{personalRoadmap.note}</p>}
                  <ActionButton
                    icon={Copy}
                    label={copySharedMutation.isPending ? 'Copying...' : 'Copy to my roadmaps'}
                    variant="primary"
                    size="md"
                    onClick={() => copySharedMutation.mutate()}
                    disabled={copySharedMutation.isPending || !profileId}
                    className="mt-4 w-full"
                  />
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--md3-on-surface-variant)]">Step Details</p>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Step name</span>
                      <input
                        value={stepName}
                        onChange={(event) => setStepName(event.target.value)}
                        className="w-full rounded-lg border-2 border-[var(--md3-outline)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--md3-primary)]"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Description</span>
                      <textarea
                        value={stepDescription}
                        onChange={(event) => setStepDescription(event.target.value)}
                        className="h-20 w-full resize-none rounded-lg border-2 border-[var(--md3-outline)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--md3-primary)]"
                      />
                    </label>
                    {technicalSkills.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-sm font-medium text-[var(--md3-on-surface)]">Skills</p>
                        <SkillSearchPicker
                          skills={technicalSkills}
                          selectedSkillIds={selectedSkillIds}
                          onToggle={toggleSkill}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                    <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Progress Status</p>
                    <NodeStatusPicker
                      value={optimisticStatus ?? selectedNodeProgress.status}
                      onChange={handleStatusChange}
                      disabled={saveStepMutation.isPending}
                    />
                  </div>

                  <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                    <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Note</p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note..."
                      className="w-full h-24 px-4 py-3 bg-white border-2 border-[var(--md3-outline)] rounded-lg focus:border-[var(--md3-primary)] focus:outline-none resize-none text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <ActionButton icon={Save} label={saveStepMutation.isPending ? 'Saving...' : 'Save'} variant="primary" size="lg" onClick={handleSave} disabled={saveStepMutation.isPending || !stepName.trim()} className="w-full" />
                    <ActionButton icon={Trash2} label="Delete Step" variant="danger" size="md" onClick={() => setDeleteStepId(selectedNodeProgress.roadmapNodeId)} disabled={deleteStepMutation.isPending || progressNodes.length <= 1} className="w-full" />
                  </div>
                </>
              )}

              <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--md3-on-surface-variant)]">Learning Resources</p>
                  {!shared && <ActionButton icon={Plus} label="Add" variant="text" onClick={addResourceDraft} />}
                </div>
                {resourcesLoading && shared ? (
                  <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                ) : !shared ? (
                  <div className="space-y-3">
                    {resourceDrafts.length === 0 ? (
                      <p className="text-sm text-[var(--md3-on-surface-variant)]">No resources for this node.</p>
                    ) : resourceDrafts.map((resource, index) => (
                      <div key={resource.id ?? index} className="rounded-lg border border-[var(--md3-outline-variant)] p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <input
                            value={resource.name}
                            onChange={(event) => updateResourceDraft(index, 'name', event.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                            placeholder="Resource name"
                          />
                          <button
                            type="button"
                            onClick={() => removeResourceDraft(index)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--md3-error)] hover:bg-[var(--md3-error-container)]"
                            aria-label="Remove resource"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          value={resource.resourceUrl}
                          onChange={(event) => updateResourceDraft(index, 'resourceUrl', event.target.value)}
                          className="mb-2 w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                          placeholder="https://..."
                        />
                        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            value={resource.resourceType}
                            onChange={(event) => updateResourceDraft(index, 'resourceType', event.target.value)}
                            className="rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                            placeholder="Article"
                          />
                          <input
                            value={resource.provider}
                            onChange={(event) => updateResourceDraft(index, 'provider', event.target.value)}
                            className="rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                            placeholder="Provider"
                          />
                          <label className="flex items-center gap-2 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm text-[var(--md3-on-surface)]">
                            <input
                              type="checkbox"
                              checked={resource.isFree}
                              onChange={(event) => updateResourceDraft(index, 'isFree', event.target.checked)}
                            />
                            Free
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : resources.length === 0 ? (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No resources for this node.</p>
                ) : (
                  <div className="space-y-3">
                    {resources.map((r) => (
                      <RoadmapResourceCard key={r.id} resource={r} />
                    ))}
                    {recommended.map((r) => (
                      <RoadmapResourceCard key={`rec-${r.id}`} resource={r} recommended />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Snackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
      {showRoadmapSettings && (
        <RoadmapSettingsDialog
          name={roadmapName}
          description={roadmapDescription}
          note={roadmapNote}
          saving={updateRoadmapMutation.isPending}
          onNameChange={setRoadmapName}
          onDescriptionChange={setRoadmapDescription}
          onNoteChange={setRoadmapNote}
          onClose={() => setShowRoadmapSettings(false)}
          onSave={() => updateRoadmapMutation.mutate()}
        />
      )}
      {showAddStep && (
        <AddStepDialog
          progressNodes={progressNodes}
          technicalSkills={technicalSkills}
          adding={addStepMutation.isPending}
          onClose={() => setShowAddStep(false)}
          onAdd={(draft) => addStepMutation.mutate(draft)}
        />
      )}
      <ConfirmDialog
        isOpen={deleteStepId !== null}
        title="Delete Roadmap Step?"
        message="This removes the step, its progress, skills, and learning resources from this roadmap."
        confirmLabel={deleteStepMutation.isPending ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={() => { if (deleteStepId) deleteStepMutation.mutate(deleteStepId); }}
        onCancel={() => setDeleteStepId(null)}
      />
    </AppShell>
  );
}

interface AddStepDraft {
  name: string;
  description?: string;
  parentRoadmapNodeId?: string;
  positionX?: number;
  positionY?: number;
  technicalSkillIds: string[];
  learningResources: ResourceDraft[];
}

interface RoadmapSettingsDialogProps {
  name: string;
  description: string;
  note: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

function RoadmapSettingsDialog({
  name,
  description,
  note,
  saving,
  onNameChange,
  onDescriptionChange,
  onNoteChange,
  onClose,
  onSave,
}: RoadmapSettingsDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={saving ? undefined : onClose} />
      <div className="relative mx-4 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Roadmap Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]"
            aria-label="Close roadmap details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Roadmap name</span>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              maxLength={160}
              className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Description</span>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Goal note</span>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <ActionButton icon={X} label="Cancel" variant="text" onClick={onClose} disabled={saving} />
          <ActionButton icon={Save} label={saving ? 'Saving...' : 'Save'} variant="primary" onClick={onSave} disabled={saving || !name.trim()} />
        </div>
      </div>
    </div>
  );
}

interface AddStepDialogProps {
  progressNodes: ProgressNode[];
  technicalSkills: TechnicalSkillDto[];
  adding: boolean;
  onClose: () => void;
  onAdd: (draft: AddStepDraft) => void;
}

function AddStepDialog({ progressNodes, technicalSkills, adding, onClose, onAdd }: AddStepDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentRoadmapNodeId, setParentRoadmapNodeId] = useState('');
  const [positionX, setPositionX] = useState('');
  const [positionY, setPositionY] = useState('');
  const [technicalSkillIds, setTechnicalSkillIds] = useState<string[]>([]);
  const [learningResources, setLearningResources] = useState<ResourceDraft[]>([]);

  const toggleSkill = (skillId: string) => {
    setTechnicalSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  };

  const addLearningResource = () => {
    setLearningResources((current) => [
      ...current,
      { name: '', resourceUrl: '', resourceType: 'Article', provider: '', isFree: true },
    ]);
  };

  const updateLearningResource = <TKey extends keyof ResourceDraft>(
    index: number,
    field: TKey,
    value: ResourceDraft[TKey],
  ) => {
    setLearningResources((current) =>
      current.map((resource, resourceIndex) =>
        resourceIndex === index ? { ...resource, [field]: value } : resource,
      ),
    );
  };

  const removeLearningResource = (index: number) => {
    setLearningResources((current) => current.filter((_, resourceIndex) => resourceIndex !== index));
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      parentRoadmapNodeId: parentRoadmapNodeId || undefined,
      positionX: positionX.trim() === '' ? undefined : Number(positionX),
      positionY: positionY.trim() === '' ? undefined : Number(positionY),
      technicalSkillIds,
      learningResources: learningResources
        .map((resource) => ({
          ...resource,
          name: resource.name.trim(),
          resourceUrl: resource.resourceUrl.trim(),
          resourceType: resource.resourceType.trim() || 'Article',
          provider: resource.provider.trim(),
        }))
        .filter((resource) => resource.name && resource.resourceUrl),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={adding ? undefined : onClose} />
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--md3-outline-variant)] p-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--md3-on-surface)]">Add Roadmap Step</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]"
            aria-label="Close add step"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Step name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={140}
              className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-20 w-full resize-none rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Branch from</span>
            <select
              value={parentRoadmapNodeId}
              onChange={(event) => setParentRoadmapNodeId(event.target.value)}
              className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
            >
              <option value="">Last step</option>
              {progressNodes.map((progress) => (
                <option key={progress.roadmapNodeId} value={progress.roadmapNodeId}>
                  {progress.node.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">X-axis</span>
              <input
                type="number"
                value={positionX}
                onChange={(event) => setPositionX(event.target.value)}
                min={0}
                max={1400}
                step={10}
                className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                placeholder="540"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--md3-on-surface)]">Y-axis</span>
              <input
                type="number"
                value={positionY}
                onChange={(event) => setPositionY(event.target.value)}
                min={0}
                max={2000}
                step={10}
                className="w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                placeholder="240"
              />
            </label>
          </div>
          {technicalSkills.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--md3-on-surface)]">Skills</p>
              <SkillSearchPicker
                skills={technicalSkills}
                selectedSkillIds={technicalSkillIds}
                onToggle={toggleSkill}
              />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--md3-on-surface)]">Learning Resources</p>
              <ActionButton icon={Plus} label="Add Resource" variant="text" size="sm" onClick={addLearningResource} />
            </div>
            <div className="space-y-2">
              {learningResources.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--md3-outline-variant)] px-3 py-4 text-sm text-[var(--md3-on-surface-variant)]">
                  No resources added yet.
                </p>
              ) : learningResources.map((resource, resourceIndex) => (
                <div key={resourceIndex} className="rounded-lg border border-[var(--md3-outline-variant)] p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={resource.name}
                      onChange={(event) => updateLearningResource(resourceIndex, 'name', event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                      placeholder="Resource name"
                    />
                    <button
                      type="button"
                      onClick={() => removeLearningResource(resourceIndex)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--md3-error)] hover:bg-[var(--md3-error-container)]"
                      aria-label="Remove resource"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={resource.resourceUrl}
                    onChange={(event) => updateLearningResource(resourceIndex, 'resourceUrl', event.target.value)}
                    className="mb-2 w-full rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                    placeholder="https://..."
                  />
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={resource.resourceType}
                      onChange={(event) => updateLearningResource(resourceIndex, 'resourceType', event.target.value)}
                      className="rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                      placeholder="Article"
                    />
                    <input
                      value={resource.provider}
                      onChange={(event) => updateLearningResource(resourceIndex, 'provider', event.target.value)}
                      className="rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm outline-none focus:border-[var(--md3-primary)]"
                      placeholder="Provider"
                    />
                    <label className="flex items-center gap-2 rounded-lg border border-[var(--md3-outline)] px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={resource.isFree}
                        onChange={(event) => updateLearningResource(resourceIndex, 'isFree', event.target.checked)}
                      />
                      Free
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--md3-outline-variant)] p-6">
          <ActionButton icon={X} label="Cancel" variant="text" onClick={onClose} disabled={adding} />
          <ActionButton icon={Plus} label={adding ? 'Adding...' : 'Add Step'} variant="primary" onClick={handleAdd} disabled={adding || !name.trim()} />
        </div>
      </div>
    </div>
  );
}
