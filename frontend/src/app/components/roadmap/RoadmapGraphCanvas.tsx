import { useMemo } from 'react';
import type { ReactElement } from 'react';
import {
  ReactFlow as _ReactFlow,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  type Edge,
  type Node,
} from '@xyflow/react';
import type { ReactFlowProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_STATUS_COLORS, type NodeStatusInt } from '@/constants/nodeStatus';

const ReactFlow = _ReactFlow as unknown as (
  props: ReactFlowProps & { className?: string },
) => ReactElement;

export interface RoadmapGraphNode {
  id: string;
  parentNodeId?: string;
  name: string;
  description?: string;
  order: number;
  status?: NodeStatusInt;
}

interface RoadmapGraphCanvasProps {
  graphNodes: RoadmapGraphNode[];
  selectedNodeId?: string;
  onNodeSelect?: (node: RoadmapGraphNode) => void;
}

function getNodeDepths(nodes: RoadmapGraphNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depthById = new Map<string, number>();

  const resolveDepth = (node: RoadmapGraphNode, visiting = new Set<string>()): number => {
    if (depthById.has(node.id)) return depthById.get(node.id)!;
    if (!node.parentNodeId || !byId.has(node.parentNodeId) || visiting.has(node.id)) {
      depthById.set(node.id, 0);
      return 0;
    }
    visiting.add(node.id);
    const parent = byId.get(node.parentNodeId)!;
    const depth = resolveDepth(parent, visiting) + 1;
    depthById.set(node.id, depth);
    return depth;
  };

  nodes.forEach((node) => resolveDepth(node));
  return depthById;
}

function mapToFlow(nodes: RoadmapGraphNode[], selectedNodeId?: string) {
  type GraphPosition = { x: number; y: number };
  const depthById = getNodeDepths(nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string, RoadmapGraphNode[]>();

  nodes.forEach((node) => {
    if (!node.parentNodeId || !byId.has(node.parentNodeId)) return;
    const children = childrenByParent.get(node.parentNodeId) ?? [];
    children.push(node);
    childrenByParent.set(node.parentNodeId, children);
  });

  childrenByParent.forEach((children) => {
    children.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  });

  const X_GAP = 300;
  const Y_GAP = 112;
  const START_X = 96;
  const START_Y = 112;
  const positions = new Map<string, GraphPosition>();
  const visited = new Set<string>();
  let row = 0;

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
    const position = { x: START_X + depth * X_GAP, y };

    positions.set(node.id, position);
    return position;
  };

  const rootNodes = nodes
    .filter((node) => !node.parentNodeId || !byId.has(node.parentNodeId))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  rootNodes.forEach((node) => layoutNode(node));
  nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .forEach((node) => layoutNode(node));

  const flowNodes: Node[] = [];

  nodes.forEach((node) => {
    const status = node.status ?? 0;
    const colors = NODE_STATUS_COLORS[status];
    const isSelected = node.id === selectedNodeId;
    const depth = depthById.get(node.id) ?? 0;
    flowNodes.push({
      id: node.id,
      type: 'default',
      position: positions.get(node.id) ?? {
        x: START_X + depth * X_GAP,
        y: START_Y,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: (
          <div className="w-[190px]">
            <p className="line-clamp-2 text-[13px] font-semibold leading-5">{node.name}</p>
            {node.description && (
              <p className="mt-1 line-clamp-1 text-[11px] font-normal opacity-75">
                {node.description}
              </p>
            )}
          </div>
        ),
      },
      style: {
        background: colors.fill,
        color: colors.text,
        border: `${isSelected ? 3 : 1}px solid ${colors.stroke}`,
        borderRadius: 8,
        boxShadow: isSelected
          ? `0 6px 16px ${colors.stroke}40`
          : '0 1px 3px rgba(0,0,0,0.12)',
        minHeight: 64,
        width: 230,
        padding: '10px 14px',
      },
    });
  });

  const flowEdges: Edge[] = nodes
    .filter((node) => node.parentNodeId && byId.has(node.parentNodeId))
    .map((node) => {
      const colors = NODE_STATUS_COLORS[node.status ?? 0];
      return {
        id: `${node.parentNodeId}-${node.id}`,
        source: node.parentNodeId!,
        target: node.id,
        type: 'smoothstep',
        animated: node.status === 1,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: node.status === 0 ? '#B8BDC4' : colors.stroke,
        },
        style: {
          stroke: node.status === 0 ? '#B8BDC4' : colors.stroke,
          strokeWidth: node.status === 0 ? 1.5 : 2.5,
        },
      };
    });

  return { flowNodes, flowEdges };
}

export function RoadmapGraphCanvas({
  graphNodes,
  selectedNodeId,
  onNodeSelect,
}: RoadmapGraphCanvasProps) {
  const { flowNodes, flowEdges } = useMemo(
    () => mapToFlow(graphNodes, selectedNodeId),
    [graphNodes, selectedNodeId],
  );
  const nodeById = useMemo(() => new Map(graphNodes.map((node) => [node.id, node])), [graphNodes]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodeClick={(_, node) => {
        const graphNode = nodeById.get(node.id);
        if (graphNode) onNodeSelect?.(graphNode);
      }}
      fitView
      fitViewOptions={{ padding: 0.16 }}
      minZoom={0.35}
      nodesDraggable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#DADCE0" gap={24} />
      <Controls position="top-right" />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node) => String(node.style?.background ?? '#E8EAED')}
      />
    </ReactFlow>
  );
}
