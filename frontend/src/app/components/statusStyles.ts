export type NodeStatus = 'not-started' | 'in-progress' | 'paused' | 'skipped' | 'completed';

export const NODE_STATUS_STYLES: Record<NodeStatus, { fill: string; text: string; stroke: string; label: string }> = {
  'not-started': {
    fill: 'var(--md3-status-not-started-fill)',
    text: 'var(--md3-status-not-started-text)',
    stroke: 'var(--md3-status-not-started-stroke)',
    label: 'Not Started',
  },
  'in-progress': {
    fill: 'var(--md3-status-in-progress-fill)',
    text: 'var(--md3-status-in-progress-text)',
    stroke: 'var(--md3-status-in-progress-stroke)',
    label: 'In Progress',
  },
  paused: {
    fill: 'var(--md3-status-paused-fill)',
    text: 'var(--md3-status-paused-text)',
    stroke: 'var(--md3-status-paused-stroke)',
    label: 'Paused',
  },
  skipped: {
    fill: 'var(--md3-status-skipped-fill)',
    text: 'var(--md3-status-skipped-text)',
    stroke: 'var(--md3-status-skipped-stroke)',
    label: 'Skipped',
  },
  completed: {
    fill: 'var(--md3-status-completed-fill)',
    text: 'var(--md3-status-completed-text)',
    stroke: 'var(--md3-status-completed-stroke)',
    label: 'Done',
  },
};
