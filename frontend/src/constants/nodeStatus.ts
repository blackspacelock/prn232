export type NodeStatusInt = 0 | 1 | 2 | 3 | 4;

export interface NodeStatusStyle {
  fill: string;
  stroke: string;
  text: string;
  label: string;
}

export const NODE_STATUS_COLORS: Record<NodeStatusInt, NodeStatusStyle> = {
  0: {
    fill: '#F1F3F4',
    stroke: '#DADCE0',
    text: '#5F6368',
    label: 'Not Started',
  },
  1: {
    fill: '#E8F0FE',
    stroke: '#4285F4',
    text: '#1A73E8',
    label: 'In Progress',
  },
  2: {
    fill: '#FEF7E0',
    stroke: '#FBBC04',
    text: '#E37400',
    label: 'Paused',
  },
  3: {
    fill: '#F3E8FD',
    stroke: '#AB47BC',
    text: '#7B1FA2',
    label: 'Skipped',
  },
  4: {
    fill: '#E6F4EA',
    stroke: '#34A853',
    text: '#1E8E3E',
    label: 'Completed',
  },
};
