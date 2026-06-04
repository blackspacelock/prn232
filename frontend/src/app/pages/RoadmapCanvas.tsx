import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Snackbar } from '../components/Snackbar';
import { ActionButton } from '../components/ActionButton';
import { X, Save } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { NODE_STATUS_COLORS, type NodeStatusInt } from '@/constants/nodeStatus';
import { RoadmapCanvasHeader } from '../components/roadmap/RoadmapCanvasHeader';
import { RoadmapGraphCanvas, type RoadmapGraphNode } from '../components/roadmap/RoadmapGraphCanvas';
import { RoadmapResourceCard } from '../components/roadmap/RoadmapResourceCard';
import {
  GET_CAREER_ROADMAP_WITH_NODES,
  GET_PERSONAL_ROADMAP_WITH_PROGRESS,
  GET_NODE_PROGRESS,
  GET_LEARNING_RESOURCES_BY_NODE,
  GET_RECOMMENDED_RESOURCES,
} from '@/graphql/queries';
import type {
  CareerRoadmapWithNodesDto,
  NodeProgressDto,
  UpdateNodeProgressStatusDto,
} from '@/types/api';

type ProgressNode = NodeProgressDto;

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
  const { id: personalRoadmapId } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';

  const [selectedNodeProgress, setSelectedNodeProgress] = useState<ProgressNode | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<NodeStatusInt | null>(null);
  const [previousStatus, setPreviousStatus] = useState<NodeStatusInt | null>(null);
  const [note, setNote] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const { data, loading, error, refetch } = useQuery(GET_PERSONAL_ROADMAP_WITH_PROGRESS, {
    variables: { personalRoadmapId },
    skip: !personalRoadmapId,
  });

  const { data: progressData } = useQuery(GET_NODE_PROGRESS, {
    variables: { personalRoadmapId },
    skip: !personalRoadmapId,
  });

  const [loadResources, { data: resourcesData, loading: resourcesLoading }] = useLazyQuery(GET_LEARNING_RESOURCES_BY_NODE);
  const [loadRecommended, { data: recommendedData }] = useLazyQuery(GET_RECOMMENDED_RESOURCES);

  const progressNodes: ProgressNode[] = useMemo(
    () => (data as { personalRoadmapWithProgress?: { nodeProgresses?: ProgressNode[] } })?.personalRoadmapWithProgress?.nodeProgresses ?? [],
    [data],
  );
  const personalRoadmap = (data as { personalRoadmapWithProgress?: { careerRoadmapId?: string } })
    ?.personalRoadmapWithProgress;
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
  const resources: LearningResource[] = (resourcesData as { learningResourcesByNode?: LearningResource[] })?.learningResourcesByNode ?? [];
  const recommended: LearningResource[] = (recommendedData as { recommendedResources?: LearningResource[] })?.recommendedResources ?? [];

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
        status: np.status as NodeStatusInt,
      })),
    [progressNodes],
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ nodeProgressId, dto }: { nodeProgressId: string; dto: UpdateNodeProgressStatusDto }) =>
      apiClient.put(`/api/node-progress/${nodeProgressId}/status`, dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_NODE_PROGRESS] });
    },
    onError: (error: unknown) => {
      if (previousStatus !== null) {
        setOptimisticStatus(previousStatus);
      }
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update status.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const handleNodeSelect = useCallback((node: RoadmapGraphNode) => {
    const np = progressNodes.find((p) => p.roadmapNodeId === node.id);
    if (np) {
      setSelectedNodeProgress(np);
      setOptimisticStatus(np.status as NodeStatusInt);
      setPreviousStatus(np.status as NodeStatusInt);
      setNote(np.note ?? '');
      loadResources({ variables: { nodeId: np.nodeId } });
      loadRecommended({ variables: { profileId, nodeId: np.nodeId } });
    }
  }, [progressNodes, profileId, loadResources, loadRecommended]);

  const handleStatusChange = (newStatus: NodeStatusInt) => {
    setPreviousStatus(optimisticStatus);
    setOptimisticStatus(newStatus);
  };

  const handleSave = () => {
    if (!selectedNodeProgress || optimisticStatus === null) return;
    updateStatusMutation.mutate({
      nodeProgressId: selectedNodeProgress.id,
      dto: { status: optimisticStatus, note: note || undefined },
    });
  };

  const completedCount = summary.filter((n: { status: number }) => n.status === 4).length;
  const totalCount = summary.length;

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
        { label: 'Roadmaps', to: '/roadmaps' },
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
            progress={{ completed: completedCount, total: totalCount }}
          />
          <RoadmapGraphCanvas
            graphNodes={graphNodes}
            graphEdges={template?.edges}
            selectedNodeId={selectedNodeProgress?.roadmapNodeId}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {selectedNodeProgress && (
          <div className="flex w-full flex-col overflow-hidden border-l border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] shadow-xl md:w-[420px]">
            <div className="border-b border-[var(--md3-outline-variant)] bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-[var(--md3-on-surface)]">{selectedNodeProgress.node.name}</h2>
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
              <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Progress Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {([0, 1, 2, 3, 4] as NodeStatusInt[]).map((s) => {
                    const c = NODE_STATUS_COLORS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className="px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all"
                        style={{
                          background: optimisticStatus === s ? c.fill : 'transparent',
                          color: optimisticStatus === s ? c.text : 'var(--md3-on-surface-variant)',
                          borderColor: optimisticStatus === s ? c.stroke : 'var(--md3-outline)',
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
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

              <ActionButton icon={Save} label={updateStatusMutation.isPending ? 'Saving...' : 'Save progress'} variant="primary" size="lg" onClick={handleSave} disabled={updateStatusMutation.isPending} className="w-full" />

              <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4">
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Learning Resources</p>
                {resourcesLoading ? (
                  <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
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

      <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
    </AppShell>
  );
}
