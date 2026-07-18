import { useMemo } from 'react';
import type { ReactElement } from 'react';
import {
  ReactFlow as _ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  BaseEdge,
  MarkerType,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import type { ReactFlowProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeStatusInt } from '@/constants/nodeStatus';
import { RoadmapGraphNodeCard, type RoadmapGraphFlowNode } from './RoadmapGraphNodeCard';

const ReactFlow = _ReactFlow as unknown as (
  props: ReactFlowProps & { className?: string },
) => ReactElement;

const nodeTypes = {
  roadmapNode: RoadmapGraphNodeCard,
};

const edgeTypes = {
  roadmapBranch: RoadmapBranchEdge,
};

interface RoadmapBranchEdgeData extends Record<string, unknown> {
  side: 'left' | 'right';
  soft?: boolean;
}

type RoadmapBranchEdge = Edge<RoadmapBranchEdgeData, 'roadmapBranch'>;

function RoadmapBranchEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}: EdgeProps<RoadmapBranchEdge>) {
  const side = data?.side ?? (targetX < sourceX ? 'left' : 'right');
  const direction = side === 'left' ? -1 : 1;
  const branchGap = Math.max(36, Math.min(72, Math.abs(targetX - sourceX) * 0.28));
  const busX = sourceX + direction * branchGap;
  const path = `M ${sourceX} ${sourceY} L ${busX} ${sourceY} L ${busX} ${targetY} L ${targetX} ${targetY}`;

  return (
    <BaseEdge
      path={path}
      style={{
        ...style,
        fill: 'none',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    />
  );
}

export interface RoadmapGraphNode {
  id: string;
  nodeId?: string;
  parentRoadmapNodeId?: string;
  name: string;
  description?: string;
  order: number;
  nodeType?: string;
  requirementType?: string;
  positionX?: number;
  positionY?: number;
  status?: NodeStatusInt;
}

export interface RoadmapGraphEdge {
  id: string;
  fromRoadmapNodeId: string;
  toRoadmapNodeId: string;
  edgeType?: string;
}

interface RoadmapGraphCanvasProps {
  graphNodes: RoadmapGraphNode[];
  graphEdges?: RoadmapGraphEdge[];
  selectedNodeId?: string;
  useStatusColors?: boolean;
  onNodeSelect?: (node: RoadmapGraphNode) => void;
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void;
}

function getNodeDepths(nodes: RoadmapGraphNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depthById = new Map<string, number>();

  const resolveDepth = (node: RoadmapGraphNode, visiting = new Set<string>()): number => {
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

function mapToFlow(
  nodes: RoadmapGraphNode[],
  graphEdges: RoadmapGraphEdge[] = [],
  selectedNodeId?: string,
  useStatusColors = false,
) {
  type GraphPosition = { x: number; y: number };
  const depthById = getNodeDepths(nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string, RoadmapGraphNode[]>();

  nodes.forEach((node) => {
    if (!node.parentRoadmapNodeId || !byId.has(node.parentRoadmapNodeId)) return;
    const children = childrenByParent.get(node.parentRoadmapNodeId) ?? [];
    children.push(node);
    childrenByParent.set(node.parentRoadmapNodeId, children);
  });

  childrenByParent.forEach((children) => {
    children.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  });

  const X_GAP = 320;
  const Y_GAP = 96;
  const START_X = 540;
  const START_Y = 120;
  const positions = new Map<string, GraphPosition>();
  const visited = new Set<string>();
  let row = 0;
  const storedPositionNodes = nodes.filter(
    (node) => typeof node.positionX === 'number' && typeof node.positionY === 'number',
  );
  const shouldUseStoredPositions = storedPositionNodes.length >= Math.max(3, nodes.length * 0.6);

  if (shouldUseStoredPositions) {
    storedPositionNodes.forEach((node) => {
      positions.set(node.id, {
        x: node.positionX ?? 0,
        y: node.positionY ?? 0,
      });
      visited.add(node.id);
    });
  }

  const layoutNode = (node: RoadmapGraphNode): GraphPosition | undefined => {
    if (visited.has(node.id)) return positions.get(node.id);

    visited.add(node.id);
    const children = childrenByParent.get(node.id) ?? [];
    const childPositions: GraphPosition[] = children
      .map((child) => layoutNode(child))
      .filter((position): position is GraphPosition => Boolean(position));
    const depth = depthById.get(node.id) ?? 0;
    const y =
      childPositions.length > 0
        ? childPositions.reduce((sum: number, position: GraphPosition) => sum + position.y, 0) /
          childPositions.length
        : START_Y + row++ * Y_GAP;
    const direction = depth === 0 ? 0 : depth % 2 === 0 ? 1 : -1;
    const position = {
      x: START_X + direction * Math.ceil(depth / 2) * X_GAP,
      y,
    };

    positions.set(node.id, position);
    return position;
  };

  const rootNodes = nodes
    .filter((node) => !node.parentRoadmapNodeId || !byId.has(node.parentRoadmapNodeId))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  rootNodes.forEach((node) => layoutNode(node));
  nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .forEach((node) => layoutNode(node));

  const flowNodes: RoadmapGraphFlowNode[] = [];

  nodes.forEach((node) => {
    const depth = depthById.get(node.id) ?? 0;
    flowNodes.push({
      id: node.id,
      type: 'roadmapNode',
      selected: node.id === selectedNodeId,
      position: positions.get(node.id) ?? {
        x: START_X + depth * X_GAP,
        y: START_Y,
      },
      data: {
        name: node.name,
        description: node.description,
        nodeType: node.nodeType,
        requirementType: node.requirementType,
        status: node.status,
        useStatusColor: useStatusColors,
      },
    });
  });

  const siblingIndexById = new Map<string, { index: number; total: number }>();
  childrenByParent.forEach((children) => {
    children.forEach((child, index) => {
      siblingIndexById.set(child.id, { index, total: children.length });
    });
  });

  const parentEdges: RoadmapBranchEdge[] = nodes
    .filter((node) => node.parentRoadmapNodeId && byId.has(node.parentRoadmapNodeId))
    .map((node) => {
      const parentPosition = positions.get(node.parentRoadmapNodeId!);
      const nodePosition = positions.get(node.id);
      const isLeftBranch =
        parentPosition && nodePosition ? nodePosition.x < parentPosition.x : false;
      const requirementType = node.requirementType?.toLowerCase() ?? '';
      const isSoftRequirement =
        requirementType.includes('optional') || requirementType.includes('recommended');
      const sibling = siblingIndexById.get(node.id);
      const sourceSlot =
        sibling && sibling.total > 1
          ? Math.round((sibling.index / (sibling.total - 1)) * 4)
          : 2;
      const sourceSide = isLeftBranch ? 'left' : 'right';
      return {
        id: `parent-${node.parentRoadmapNodeId}-${node.id}`,
        source: node.parentRoadmapNodeId!,
        target: node.id,
        sourceHandle: `${sourceSide}-source-${sourceSlot}`,
        targetHandle: isLeftBranch ? 'right-target' : 'left-target',
        type: 'roadmapBranch',
        animated: false,
        data: {
          side: isLeftBranch ? 'left' : 'right',
          soft: isSoftRequirement,
        },
        style: {
          stroke: '#2563eb',
          strokeWidth: 2.2,
          strokeLinecap: 'round',
          strokeDasharray: isSoftRequirement ? '1 7' : '2 6',
        },
      };
    });

  const explicitEdges: Edge[] = graphEdges
    .filter((edge) => byId.has(edge.fromRoadmapNodeId) && byId.has(edge.toRoadmapNodeId))
    .map((edge) => ({
      id: edge.id,
      source: edge.fromRoadmapNodeId,
      target: edge.toRoadmapNodeId,
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: '#2563eb',
      },
      style: {
        stroke: '#2563eb',
        strokeWidth: 3,
        strokeLinecap: 'round',
      },
    }));

  return { flowNodes, flowEdges: [...parentEdges, ...explicitEdges] };
}

export function RoadmapGraphCanvas({
  graphNodes,
  graphEdges = [],
  selectedNodeId,
  useStatusColors = false,
  onNodeSelect,
  onNodePositionChange,
}: RoadmapGraphCanvasProps) {
  const { flowNodes, flowEdges } = useMemo(
    () => mapToFlow(graphNodes, graphEdges, selectedNodeId, useStatusColors),
    [graphNodes, graphEdges, selectedNodeId, useStatusColors],
  );
  const graphKey = useMemo(
    () =>
      [
        graphNodes.map((node) => node.id).join('|'),
        graphNodes.map((node) => `${node.id}:${node.status ?? 'none'}`).join('|'),
        graphNodes.map((node) => `${node.id}:${node.positionX ?? 'auto'},${node.positionY ?? 'auto'}`).join('|'),
        graphEdges.map((edge) => edge.id).join('|'),
        useStatusColors ? 'status-colors' : 'structure-colors',
      ].join('::'),
    [graphNodes, graphEdges, useStatusColors],
  );
  const nodeById = useMemo(() => new Map(graphNodes.map((node) => [node.id, node])), [graphNodes]);

  return (
    <ReactFlow
      key={graphKey}
      defaultNodes={flowNodes}
      defaultEdges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={(_, node) => {
        const graphNode = nodeById.get(node.id);
        if (graphNode) onNodeSelect?.(graphNode);
      }}
      onNodeDragStop={(_, node) => {
        onNodePositionChange?.(node.id, {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        });
      }}
      fitView
      fitViewOptions={{ padding: 0.08, maxZoom: 0.82 }}
      minZoom={0.28}
      maxZoom={1.2}
      nodesDraggable
      nodesConnectable={false}
      edgesFocusable={false}
      className="bg-[#fafafa]"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} color="#d4d4d8" gap={18} size={1.2} />
      <Controls position="top-right" />
    </ReactFlow>
  );
}
