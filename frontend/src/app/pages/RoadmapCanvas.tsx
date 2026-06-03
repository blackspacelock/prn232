import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { appToast } from '../components/AppToast';
import { StatusChip, type NodeStatus } from '../components/StatusChip';
import { ActionAnchor, ActionButton } from '../components/ActionButton';
import { ExternalLink, Save, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';

interface RoadmapNode {
  id: string;
  title: string;
  status: NodeStatus;
  children?: string[];
  position: { x: number; y: number };
}

const nodes: RoadmapNode[] = [
  { id: '1', title: 'Internet Basics', status: 'completed', children: ['2', '3'], position: { x: 400, y: 100 } },
  { id: '2', title: 'HTML & CSS', status: 'completed', children: ['4', '5'], position: { x: 300, y: 200 } },
  { id: '3', title: 'JavaScript', status: 'completed', children: ['4', '5'], position: { x: 500, y: 200 } },
  { id: '4', title: 'React', status: 'in-progress', children: ['6', '7'], position: { x: 300, y: 300 } },
  { id: '5', title: 'TypeScript', status: 'in-progress', children: ['7'], position: { x: 500, y: 300 } },
  { id: '6', title: 'Node.js', status: 'paused', children: ['8', '9'], position: { x: 200, y: 400 } },
  { id: '7', title: 'Testing', status: 'skipped', children: ['9'], position: { x: 400, y: 400 } },
  { id: '8', title: 'Deployment', status: 'not-started', children: ['10'], position: { x: 200, y: 500 } },
  { id: '9', title: 'Performance', status: 'not-started', children: ['10'], position: { x: 400, y: 500 } },
  { id: '10', title: 'CI/CD', status: 'not-started', position: { x: 300, y: 600 } },
];

export function RoadmapCanvasPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>('4');
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('in-progress');
  const [note, setNote] = useState('');

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <AppShell
        breadcrumb="Roadmaps / Frontend Developer"
        showProgress={{ current: 18, total: 24, percentage: 75 }}
        className="app-main--flush"
      >
      <div className="flex h-[calc(100vh-64px)]">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #DADCE0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <h1 className="absolute top-6 left-6 text-4xl font-bold text-[var(--md3-on-surface)]">
            Frontend Developer Roadmap
          </h1>

          {/* Controls */}
          <div className="absolute top-6 right-6 bg-white rounded-xl shadow-md p-2 flex flex-col gap-2">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-lg transition-colors">
              <ZoomIn className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-lg transition-colors">
              <ZoomOut className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-lg transition-colors">
              <Maximize2 className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-md p-4">
            <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase mb-3">Legend</p>
            <div className="space-y-2">
              <LegendItem color="var(--md3-status-completed-stroke)" label="Done" />
              <LegendItem color="var(--md3-status-in-progress-stroke)" label="In Progress" />
              <LegendItem color="var(--md3-status-paused-stroke)" label="Paused" />
              <LegendItem color="var(--md3-status-skipped-stroke)" label="Skipped" />
              <LegendItem color="var(--md3-status-not-started-stroke)" label="Not Started" />
            </div>
          </div>

          {/* Nodes and Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {nodes.map(node => {
              if (!node.children) return null;
              return node.children.map(childId => {
                const child = nodes.find(n => n.id === childId);
                if (!child) return null;

                const isActive = node.status === 'in-progress' || node.status === 'completed';

                return (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={node.position.x + 80}
                    y1={node.position.y + 22}
                    x2={child.position.x + 80}
                    y2={child.position.y + 22}
                    stroke={isActive ? 'var(--md3-primary)' : 'var(--md3-outline)'}
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              });
            })}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="var(--md3-outline)" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {nodes.map(node => (
              <RoadmapNodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                onClick={() => setSelectedNode(node.id)}
              />
            ))}
          </div>
        </div>

        {/* Node Details Drawer */}
        {selectedNode && selectedNodeData && (
          <div className="w-[400px] bg-white border-l border-[var(--md3-outline-variant)] shadow-xl flex flex-col">
            <div className="p-6 border-b border-[var(--md3-outline-variant)]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">
                    {selectedNodeData.title}
                  </h2>
                  <StatusChip status={nodeStatus} />
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Progress Status */}
              <div>
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">
                  Progress Status
                </p>
                <div className="flex gap-2">
                  <StatusButton
                    label="Not Started"
                    active={nodeStatus === 'not-started'}
                    onClick={() => setNodeStatus('not-started')}
                  />
                  <StatusButton
                    label="In Progress"
                    active={nodeStatus === 'in-progress'}
                    onClick={() => setNodeStatus('in-progress')}
                  />
                  <StatusButton
                    label="Done"
                    active={nodeStatus === 'completed'}
                    onClick={() => setNodeStatus('completed')}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <StatusButton
                    label="Paused"
                    active={nodeStatus === 'paused'}
                    onClick={() => setNodeStatus('paused')}
                  />
                  <StatusButton
                    label="Skipped"
                    active={nodeStatus === 'skipped'}
                    onClick={() => setNodeStatus('skipped')}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">
                  Note
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full h-24 px-4 py-3 bg-white border-2 border-[var(--md3-outline)] rounded focus:border-[var(--md3-primary)] focus:outline-none resize-none"
                />
              </div>

              <ActionButton
                icon={Save}
                label="Save progress"
                variant="primary"
                size="lg"
                onClick={() => appToast.success(
                  `Progress updated - ${selectedNodeData?.title ?? 'Node'} marked ${nodeStatus.replace('-', ' ')}`,
                  {
                    actionLabel: 'Undo',
                    onAction: () => appToast.info('Progress update reverted'),
                  },
                )}
                className="w-full"
              />

              <div className="h-px bg-[var(--md3-outline-variant)]" />

              {/* Learning Resources */}
              <div>
                <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] uppercase tracking-wider mb-3">
                  Learning Resources
                </p>
                <div className="space-y-3">
                  <ResourceCard
                    title="React Official Docs"
                    type="Article"
                    provider="Meta"
                    isFree
                  />
                  <ResourceCard
                    title="React Complete Guide"
                    type="Course"
                    provider="Udemy"
                    isFree={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </AppShell>
  );
}

function RoadmapNodeComponent({ node, isSelected, onClick }: { node: RoadmapNode; isSelected: boolean; onClick: () => void }) {
  const getStatusStyles = (status: RoadmapNode['status']) => {
    const styles = {
      'completed': {
        bg: 'var(--md3-status-completed-fill)',
        text: 'var(--md3-status-completed-text)',
        border: 'var(--md3-status-completed-stroke)',
      },
      'in-progress': {
        bg: 'var(--md3-status-in-progress-fill)',
        text: 'var(--md3-status-in-progress-text)',
        border: 'var(--md3-status-in-progress-stroke)',
      },
      'paused': {
        bg: 'var(--md3-status-paused-fill)',
        text: 'var(--md3-status-paused-text)',
        border: 'var(--md3-status-paused-stroke)',
      },
      'skipped': {
        bg: 'var(--md3-status-skipped-fill)',
        text: 'var(--md3-status-skipped-text)',
        border: 'var(--md3-status-skipped-stroke)',
      },
      'not-started': {
        bg: 'var(--md3-status-not-started-fill)',
        text: 'var(--md3-status-not-started-text)',
        border: 'var(--md3-status-not-started-stroke)',
      },
    };
    return styles[status];
  };

  const styles = getStatusStyles(node.status);

  return (
    <button
      onClick={onClick}
      className="absolute px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer hover:scale-105"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        minWidth: '160px',
        backgroundColor: styles.bg,
        color: styles.text,
        border: `2px solid ${styles.border}`,
        boxShadow: isSelected
          ? `0 4px 8px rgba(0,0,0,0.12), 0 0 0 2px ${styles.border}`
          : '0 1px 2px rgba(0,0,0,0.10)',
      }}
    >
      {node.title}
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: styles.border }}
      />
    </button>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-[var(--md3-on-surface-variant)]">{label}</span>
    </div>
  );
}

function StatusButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-full text-xs font-medium border-2 transition-all ${
        active
          ? 'bg-[var(--md3-primary-container)] border-[var(--md3-status-in-progress-stroke)] text-[var(--md3-primary)]'
          : 'bg-white border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)]'
      }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

function ResourceCard({ title, type, provider, isFree }: { title: string; type: string; provider: string; isFree: boolean }) {
  return (
    <div className="bg-[var(--md3-surface-container)] rounded-lg p-3">
      <h4 className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">{title}</h4>
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-[var(--md3-surface-variant)] border border-[var(--md3-outline)] rounded text-xs font-mono">
          {type}
        </span>
        <span className="text-xs text-[var(--md3-on-surface-variant)]">{provider}</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: isFree ? 'var(--md3-success-container)' : 'var(--md3-surface-variant)',
            color: isFree ? 'var(--md3-success)' : 'var(--md3-on-surface-variant)',
          }}
        >
          {isFree ? 'Free' : 'Paid'}
        </span>
        <ActionAnchor icon={ExternalLink} label="Open" href="#" variant="text" />
      </div>
    </div>
  );
}
