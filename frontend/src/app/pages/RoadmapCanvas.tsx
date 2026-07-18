import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Snackbar } from '../components/Snackbar';
import { ActionButton } from '../components/ActionButton';
import { NodeStatusPicker } from '../components/NodeStatusPicker';
import { Copy, Plus, Trash2, X, Save } from 'lucide-react';
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
} from '@/graphql/queries';
import type {
  CareerRoadmapWithNodesDto,
  NodeProgressDto,
  PersonalRoadmapDetailDto,
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

  const { data: progressData } = useQuery(GET_NODE_PROGRESS, {
    variables: { personalRoadmapId },
    skip: !personalRoadmapId || shared,
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
  const personalRoadmap = (data as Record<string, { careerRoadmapId?: string; isActive?: boolean; ownerName?: string; note?: string } | undefined>)
    ?.[detailKey];
  const careerRoadmapId = personalRoadmap?.careerRoadmapId ?? '';

  const { data: templateData } = useQuery(GET_CAREER_ROADMAP_WITH_NODES, {
    variables: { roadmapId: careerRoadmapId },
    skip: !careerRoadmapId,
  });
  const template: CareerRoadmapWithNodesDto | null =
    (templateData as { careerRoadmapWithNodes?: CareerRoadmapWithNodesDto })
      ?.careerRoadmapWithNodes ?? null;
  const roadmapTitle = template?.name ?? 'Personal Roadmap';

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

  const graphNodes: RoadmapGraphNode[] = useMemo(
    () =>
      progressNodes.map((np) => ({
        id: np.roadmapNodeId,
        nodeId: np.nodeId,
        parentRoadmapNodeId: np.roadmapNode.parentRoadmapNodeId,
        name: np.node.name,
        description: np.node.description,
        order: np.roadmapNode.order,
        nodeType: np.roadmapNode.nodeType,
        requirementType: np.roadmapNode.requirementType,
        positionX: np.roadmapNode.positionX,
        positionY: np.roadmapNode.positionY,
        status:
          selectedNodeProgress?.roadmapNodeId === np.roadmapNodeId && optimisticStatus !== null
            ? optimisticStatus
            : (np.status as NodeStatusInt),
      })),
    [progressNodes, selectedNodeProgress?.roadmapNodeId, optimisticStatus],
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

  const handleNodeSelect = useCallback((node: RoadmapGraphNode) => {
    const np = progressNodes.find((p) => p.roadmapNodeId === node.id);
    if (np) {
      setSelectedNodeProgress(np);
      setOptimisticStatus(np.status as NodeStatusInt);
      setStepName(np.node.name);
      setStepDescription(np.node.description ?? '');
      setNote(np.note ?? '');
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
              nodeCount={graphNodes.length}
              isActive={shared ? undefined : personalRoadmap?.isActive}
              progress={{ completed: completedCount, total: totalCount }}
            />
          <RoadmapGraphCanvas
            graphNodes={graphNodes}
            graphEdges={template?.edges}
            selectedNodeId={selectedNodeProgress?.roadmapNodeId}
            useStatusColors
            onNodeSelect={handleNodeSelect}
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

                  <ActionButton icon={Save} label={saveStepMutation.isPending ? 'Saving...' : 'Save'} variant="primary" size="lg" onClick={handleSave} disabled={saveStepMutation.isPending || !stepName.trim()} className="w-full" />
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
    </AppShell>
  );
}
