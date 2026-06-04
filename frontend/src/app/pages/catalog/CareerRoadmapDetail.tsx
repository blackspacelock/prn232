import { useMemo, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, ChevronLeft, Map as MapIcon } from 'lucide-react';
import {
  GET_CAREER_ROADMAP_WITH_NODES,
  GET_LEARNING_RESOURCES_BY_NODE,
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
} from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '../../components/AppShell';
import { PublicLayout } from '../../components/PublicLayout';
import { Skeleton } from '../../components/Skeleton';
import { ActionLink } from '../../components/ActionButton';
import { Snackbar } from '../../components/Snackbar';
import { RoadmapCanvasHeader } from '../../components/roadmap/RoadmapCanvasHeader';
import { RoadmapGraphCanvas, type RoadmapGraphNode } from '../../components/roadmap/RoadmapGraphCanvas';
import { RoadmapTemplateInspector } from '../../components/roadmap/RoadmapTemplateInspector';
import { apiClient } from '@/lib/axios';
import { apolloClient } from '@/lib/apollo';
import type {
  CareerRoadmapWithNodesDto,
  LearningResourceDto,
  RoadmapNodeDto,
} from '@/types/api';
import type { NodeStatusInt } from '@/constants/nodeStatus';
import { useCatalogRoutes } from './catalogRoutes';

function getNodeDepths(nodes: RoadmapNodeDto[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depthById = new Map<string, number>();

  const resolveDepth = (node: RoadmapNodeDto, visiting = new Set<string>()): number => {
    if (depthById.has(node.id)) return depthById.get(node.id)!;
    if (!node.parentRoadmapNodeId || !byId.has(node.parentRoadmapNodeId) || visiting.has(node.id)) {
      depthById.set(node.id, 0);
      return 0;
    }
    visiting.add(node.id);
    const parent = byId.get(node.parentRoadmapNodeId)!;
    const depth = resolveDepth(parent, visiting) + 1;
    depthById.set(node.id, depth);
    return depth;
  };

  nodes.forEach((node) => resolveDepth(node));
  return depthById;
}

function getTemplatePreviewStatus(depth: number): NodeStatusInt {
  if (depth === 0) return 4;
  if (depth === 1) return 1;
  if (depth === 2) return 2;
  if (depth === 3) return 3;
  return 0;
}

export function CareerRoadmapDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paths = useCatalogRoutes();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [selectedRoadmapNode, setSelectedRoadmapNode] = useState<RoadmapNodeDto | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const { data, loading, error } = useQuery(GET_CAREER_ROADMAP_WITH_NODES, {
    variables: { roadmapId: id },
    skip: !id,
  });
  const roadmap: CareerRoadmapWithNodesDto | null =
    (data as { careerRoadmapWithNodes?: CareerRoadmapWithNodesDto })
      ?.careerRoadmapWithNodes ?? null;

  const [loadResources, { data: resourcesData, loading: resourcesLoading }] = useLazyQuery(
    GET_LEARNING_RESOURCES_BY_NODE,
  );
  const resources: LearningResourceDto[] =
    (resourcesData as { learningResourcesByNode?: LearningResourceDto[] })?.learningResourcesByNode ??
    [];

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient
        .post<{ id: string }>('/api/personal-roadmaps/generate', {
          profileId: user?.profileId,
          careerRoadmapId: id,
        })
        .then((r) => r.data),
    onSuccess: async (result) => {
      await apolloClient.refetchQueries({ include: [GET_PERSONAL_ROADMAPS_BY_PROFILE] });
      navigate(`/roadmap/${result.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to generate roadmap.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const graphNodes: RoadmapGraphNode[] = useMemo(() => {
    if (!roadmap) return [];
    const depthById = getNodeDepths(roadmap.nodes);
    return roadmap.nodes.map((roadmapNode) => ({
      id: roadmapNode.id,
      nodeId: roadmapNode.nodeId,
      parentRoadmapNodeId: roadmapNode.parentRoadmapNodeId,
      name: roadmapNode.node.name,
      description: roadmapNode.node.description,
      order: roadmapNode.order,
      nodeType: roadmapNode.nodeType,
      requirementType: roadmapNode.requirementType,
      positionX: roadmapNode.positionX,
      positionY: roadmapNode.positionY,
      status: getTemplatePreviewStatus(depthById.get(roadmapNode.id) ?? 0),
    }));
  }, [roadmap]);
  const levelCount = useMemo(() => {
    if (!roadmap?.nodes.length) return 0;
    const depthById = getNodeDepths(roadmap.nodes);
    return Math.max(...Array.from(depthById.values())) + 1;
  }, [roadmap]);

  const backPath = roadmap?.careerRoleId
    ? paths.roleDetailPath(roadmap.careerRoleId)
    : paths.roleListPath;

  const handleNodeSelect = (node: RoadmapGraphNode) => {
    const sourceNode = roadmap?.nodes.find((item) => item.id === node.id) ?? null;
    setSelectedRoadmapNode(sourceNode);
    if (sourceNode) {
      loadResources({ variables: { nodeId: sourceNode.nodeId } });
    }
  };

  const canvas = (
    <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row">
      <div className="relative min-h-[520px] flex-1 overflow-hidden bg-[#fafafa]">
        <RoadmapCanvasHeader
          title={roadmap?.name ?? 'Roadmap Template'}
          description={roadmap?.description}
          nodeCount={graphNodes.length}
          levelCount={levelCount}
        />
        {graphNodes.length > 0 ? (
          <RoadmapGraphCanvas
            graphNodes={graphNodes}
            graphEdges={roadmap?.edges}
            selectedNodeId={selectedRoadmapNode?.id}
            onNodeSelect={handleNodeSelect}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[var(--md3-on-surface-variant)]">
              No topics defined for this roadmap template yet.
            </p>
          </div>
        )}
      </div>

      <RoadmapTemplateInspector
        selectedNode={selectedRoadmapNode?.node ?? null}
        selectedRoadmapNode={selectedRoadmapNode}
        resources={resources}
        resourcesLoading={resourcesLoading}
        isAuthenticated={isAuthenticated}
        generating={generateMutation.isPending}
        canGenerate={Boolean(user?.profileId)}
        onGenerate={() => generateMutation.mutate()}
        onClose={() => setSelectedRoadmapNode(null)}
      />

      <Snackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        variant="error"
        onClose={() => setSnackbar({ open: false, message: '' })}
      />
    </div>
  );

  if (loading) {
    const skeleton = (
      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 p-6">
          <Skeleton className="h-full rounded-xl" />
        </div>
        <div className="hidden w-[400px] border-l border-[var(--md3-outline-variant)] bg-white p-6 md:block">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="mt-4 h-24 rounded-lg" />
        </div>
      </div>
    );

    if (paths.isProtectedCatalog) {
      return (
        <AppShell breadcrumb="Roadmap Templates / Loading" className="app-main--flush">
          {skeleton}
        </AppShell>
      );
    }

    return (
      <PublicLayout>
        {skeleton}
      </PublicLayout>
    );
  }

  if (error || !roadmap) {
    const fallback = (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6 text-center">
        <div>
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[var(--md3-error)]" />
          <p className="text-[var(--md3-on-surface-variant)]">
            {error ? 'Failed to load roadmap template.' : 'Roadmap template not found.'}
          </p>
          <ActionLink
            icon={ChevronLeft}
            label="Back to Roadmaps"
            to={paths.roleListPath}
            variant="tonal"
            size="md"
            className="mt-4"
          />
        </div>
      </div>
    );

    if (paths.isProtectedCatalog) {
      return (
        <AppShell breadcrumb="Roadmap Templates / Not Found" className="app-main--flush">
          {fallback}
        </AppShell>
      );
    }

    return <PublicLayout>{fallback}</PublicLayout>;
  }

  if (paths.isProtectedCatalog) {
    return (
      <AppShell
        breadcrumb="Roadmap Templates / Template"
        breadcrumbs={[
          { label: 'Career Roles', to: paths.roleListPath },
          { label: 'Roadmaps', to: backPath },
          { label: roadmap.name },
        ]}
        className="app-main--flush"
      >
        {canvas}
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="border-b border-[var(--md3-outline-variant)] bg-white px-6 py-3">
        <ActionLink icon={MapIcon} label="All Career Roles" to="/explore/career-roles" variant="text" />
      </div>
      {canvas}
    </PublicLayout>
  );
}
