import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { NodeStatusInt } from '@/constants/nodeStatus';

export interface RoadmapGraphNodeCardData extends Record<string, unknown> {
  name: string;
  description?: string;
  nodeType?: string;
  requirementType?: string;
  status?: NodeStatusInt;
}

export type RoadmapGraphFlowNode = Node<RoadmapGraphNodeCardData, 'roadmapNode'>;

const branchHandleOffsets = ['18%', '34%', '50%', '66%', '82%'];

function getNodeStyle(data: RoadmapGraphNodeCardData) {
  const nodeType = data.nodeType?.toLowerCase() ?? '';
  const requirementType = data.requirementType?.toLowerCase() ?? '';
  const isMain = nodeType.includes('group') || nodeType.includes('milestone');
  const isOptional = requirementType.includes('optional');
  const isRecommended = requirementType.includes('recommended');

  if (isMain) {
    return {
      className: 'min-h-11 w-[248px] bg-[#fff200] text-[#111827]',
      titleClassName: 'text-[13px] font-bold',
      labelClassName: 'text-[10px] text-[#374151]',
      dotClassName: 'bg-[#2563eb]',
    };
  }

  if (isOptional) {
    return {
      className: 'min-h-10 w-[184px] bg-white text-[#111827]',
      titleClassName: 'text-[12px] font-semibold',
      labelClassName: 'text-[9px] text-[#4b5563]',
      dotClassName: 'bg-[#8b5cf6]',
    };
  }

  if (isRecommended) {
    return {
      className: 'min-h-10 w-[184px] bg-[#dff7df] text-[#111827]',
      titleClassName: 'text-[12px] font-semibold',
      labelClassName: 'text-[9px] text-[#166534]',
      dotClassName: 'bg-[#22c55e]',
    };
  }

  return {
    className: 'min-h-10 w-[184px] bg-[#ffdf8a] text-[#111827]',
    titleClassName: 'text-[12px] font-semibold',
    labelClassName: 'text-[9px] text-[#4b5563]',
    dotClassName: 'bg-[#2563eb]',
  };
}

function RoadmapHandle({
  id,
  type,
  position,
  style,
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  style?: React.CSSProperties;
}) {
  return (
    <Handle
      id={id}
      type={type}
      position={position}
      className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      style={style}
      isConnectable={false}
    />
  );
}

function ConnectorDot({ className }: { className: string }) {
  return (
    <span
      className={[
        'pointer-events-none absolute h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm',
        className,
      ].join(' ')}
    />
  );
}

export function RoadmapGraphNodeCard({ data, selected }: NodeProps<RoadmapGraphFlowNode>) {
  const style = getNodeStyle(data);

  return (
    <div
      className={[
        'relative rounded-[4px] border-2 border-[#111827] px-3 py-2 shadow-[3px_3px_0_rgba(17,24,39,0.18)] transition-transform',
        'hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(17,24,39,0.22)]',
        selected ? 'ring-4 ring-[#2563eb]/25' : '',
        style.className,
      ].join(' ')}
    >
      <RoadmapHandle id="left-target" type="target" position={Position.Left} />
      <RoadmapHandle id="right-target" type="target" position={Position.Right} />
      <RoadmapHandle id="top-target" type="target" position={Position.Top} />
      <RoadmapHandle id="bottom-source" type="source" position={Position.Bottom} />
      {branchHandleOffsets.map((top, index) => (
        <RoadmapHandle
          key={`left-source-${index}`}
          id={`left-source-${index}`}
          type="source"
          position={Position.Left}
          style={{ top }}
        />
      ))}
      {branchHandleOffsets.map((top, index) => (
        <RoadmapHandle
          key={`right-source-${index}`}
          id={`right-source-${index}`}
          type="source"
          position={Position.Right}
          style={{ top }}
        />
      ))}
      <ConnectorDot className={`left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 ${style.dotClassName}`} />
      <ConnectorDot className={`right-0 top-1/2 translate-x-1/2 -translate-y-1/2 ${style.dotClassName}`} />
      <ConnectorDot className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[#2563eb]" />
      <ConnectorDot className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#2563eb]" />

      <div className="min-h-6">
        <p className={`line-clamp-2 leading-tight ${style.titleClassName}`}>{data.name}</p>
        {(data.nodeType || data.requirementType) && (
          <p className={`mt-1 line-clamp-1 uppercase leading-none ${style.labelClassName}`}>
            {[data.nodeType, data.requirementType].filter(Boolean).join(' / ')}
          </p>
        )}
      </div>
    </div>
  );
}
