import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: ReactNode;
  to?: string;
}

export const breadcrumbRoutes: Record<string, string> = {
  Dashboard: '/dashboard',
  Roadmaps: '/roadmaps',
  'My Roadmaps': '/roadmaps',
  'AI Mentor': '/mentor',
  'Skill Gap Analysis': '/skill-gap',
  'Skill Gap': '/skill-gap',
  'Market Pulse': '/market',
  Portfolio: '/portfolio',
  Settings: '/settings',
  'Browse Roles': '/career-roles',
  'Browse Career Roles': '/career-roles',
  'Career Roles': '/career-roles',
  'Roadmap Templates': '/career-roles',
  Admin: '/admin/career-roles',
  'Admin Roles': '/admin/career-roles',
  'Admin Templates': '/admin/roadmaps',
  'Node Library': '/admin/nodes',
  'Technical Skills': '/admin/technical-skills',
  'Learning Resources': '/admin/learning-resources',
  'Job Trends': '/admin/job-trends',
  'Node Progress Reference': '/reference/node-progress',
  'UI Reference': '/reference/ui',
};

export function breadcrumbStringToItems(breadcrumb: string): BreadcrumbItem[] {
  return breadcrumb
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      to: breadcrumbRoutes[label],
    }));
}
