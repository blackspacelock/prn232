import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Snackbar } from '../components/Snackbar';
import { ActionButton } from '../components/ActionButton';
import { X, Save } from 'lucide-react';
import {
  ReactFlow as _ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from '@xyflow/react';
import type { ReactFlowProps } from '@xyflow/react';
const ReactFlow = _ReactFlow as unknown as (props: ReactFlowProps & { className?: string }) => React.ReactElement;
import '@xyflow/react/dist/style.css';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { NODE_STATUS_COLORS, type NodeStatusInt } from '@/constants/nodeStatus';
import {
  GET_PERSONAL_ROADMAP_WITH_PROGRESS,
  GET_NODE_PROGRESS,
  GET_LEARNING_RESOURCES_BY_NODE,
  GET_RECOMMENDED_RESOURCES,
} from '@/graphql/queries';
import type { UpdateNodeProgressStatusDto } from '@/types/api';

interface ProgressNode {
  id: string;
  personalRoadmapId: string;
  nodeId: string;
  status: number;
  note?: string;
  node: { id: string; parentNodeId?: string; name: string; description?: string; order: number };
}

interface LearningResource {
  id: string;
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider?: string;
  isFree: boolean;
}

function mapToFlowNodes(progressNodes: ProgressNode[]): Node[] {
  const COLS = 4;
  const X_GAP = 220;
  const Y_GAP = 140;

  return progressNodes.map((np, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const status = np.status as NodeStatusInt;
    const colors = NODE_STATUS_COLORS[status] ?? NODE_STATUS_COLORS[0];

    return {
      id: np.id,
      type: 'default',
      position: { x: col * X_GAP + 50, y: row * Y_GAP + 50 },
      data: {
        label: np.node.name,
        status,
        nodeId: np.nodeId,
        nodeProgressId: np.id,
      },
      style: {
        background: colors.fill,
        color: colors.text,
        border: `1.5px solid ${colors.stroke}`,
        borderRadius: '12px',
        minWidth: '160px',
        fontSize: '13px',
        fontWeight: 500,
      },
    };
  });
}

function mapToFlowEdges(progressNodes: ProgressNode[]): Edge[] {
  const nodeById = new Map(progressNodes.map((np) => [np.nodeId, np.id]));
  return progressNodes.flatMap((np) => {
    const children = progressNodes.filter((p) => p.node.parentNodeId === np.nodeId);
    return children.map((child) => ({
      id: `${np.id}-${child.id}`,
      source: nodeById.get(np.nodeId) ?? np.id,
      target: child.id,
      animated: np.status === 1,
      style: { stroke: np.status === 1 ? '#1A73E8' : '#DADCE0', strokeWidth: 2 },
    }));
  });
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
  const summary = (progressData as { nodeProgress?: unknown })?.nodeProgress ?? [];
  const resources: LearningResource[] = (resourcesData as { learningResourcesByNode?: LearningResource[] })?.learningResourcesByNode ?? [];
  const recommended: LearningResource[] = (recommendedData as { recommendedResources?: LearningResource[] })?.recommendedResources ?? [];

  const nodes = useMemo(() => mapToFlowNodes(progressNodes), [progressNodes]);
  const edges = useMemo(() => mapToFlowEdges(progressNodes), [progressNodes]);

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

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const np = progressNodes.find((p) => p.id === node.id);
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
      showProgress={totalCount > 0 ? { current: completedCount, total: totalCount, percentage: Math.round((completedCount / totalCount) * 100) } : undefined}
      className="app-main--flush"
    >
      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 relative overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background color="#DADCE0" gap={24} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {selectedNodeProgress && (
          <div className="w-[400px] bg-white border-l border-[var(--md3-outline-variant)] shadow-xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--md3-outline-variant)]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-1">{selectedNodeProgress.node.name}</h2>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
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

              <div>
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Note</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full h-24 px-4 py-3 bg-white border-2 border-[var(--md3-outline)] rounded-lg focus:border-[var(--md3-primary)] focus:outline-none resize-none text-sm"
                />
              </div>

              <ActionButton icon={Save} label={updateStatusMutation.isPending ? 'Saving...' : 'Save progress'} variant="primary" size="lg" onClick={handleSave} disabled={updateStatusMutation.isPending} className="w-full" />

              <div className="h-px bg-[var(--md3-outline-variant)]" />

              <div>
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">Learning Resources</p>
                {resourcesLoading ? (
                  <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                ) : resources.length === 0 ? (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No resources for this node.</p>
                ) : (
                  <div className="space-y-3">
                    {resources.map((r) => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                    {recommended.map((r) => (
                      <ResourceCard key={`rec-${r.id}`} resource={r} recommended />
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

function ResourceCard({ resource, recommended }: { resource: LearningResource; recommended?: boolean }) {
  return (
    <a
      href={resource.resourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-[var(--md3-outline)] hover:border-[var(--md3-primary)] transition-colors"
      style={{ background: resource.isFree ? '#E6F4EA' : 'white' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{resource.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--md3-on-surface-variant)]">{resource.resourceType}</span>
            {resource.provider && <span className="text-xs text-[var(--md3-on-surface-variant)]">· {resource.provider}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${resource.isFree ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)]'}`}>
            {resource.isFree ? 'Free' : 'Paid'}
          </span>
          {recommended && <span className="text-xs px-2 py-0.5 rounded font-medium bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">AI Pick</span>}
        </div>
      </div>
    </a>
  );
}
