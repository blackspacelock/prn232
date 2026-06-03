import { Link } from 'react-router';
import { Search, Bell, ChevronRight } from 'lucide-react';

interface TopAppBarProps {
  breadcrumb: string;
  showProgress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

const breadcrumbRouteMap: Record<string, string> = {
  Dashboard: '/dashboard',
  Roadmaps: '/roadmaps',
  'AI Mentor': '/mentor',
  'Skill Gap Analysis': '/skill-gap',
  'Skill Gap': '/skill-gap',
  'Market Pulse': '/market',
  Portfolio: '/portfolio',
  Settings: '/settings',
  Admin: '/admin/career-roles',
  'Career Roles': '/admin/career-roles',
  'Roadmap Templates': '/admin/roadmaps',
  'Node Library': '/admin/nodes',
  'Job Trends': '/admin/job-trends',
  'Node Progress Reference': '/reference/node-progress',
  'UI Reference': '/reference/ui',
};

export function TopAppBar({ breadcrumb, showProgress }: TopAppBarProps) {
  const breadcrumbItems = breadcrumb.split('/').map((item) => item.trim()).filter(Boolean);

  return (
    <div
      className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--md3-outline-variant)] bg-white px-4 md:left-56 md:px-6"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10)' }}
    >
      <div className="flex items-center gap-4">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              const route = breadcrumbRouteMap[item];

              return (
                <li key={`${item}-${index}`} className="flex min-w-0 items-center gap-1">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" aria-hidden="true" />
                  )}
                  {route && !isLast ? (
                    <Link
                      to={route}
                      className="truncate rounded-full px-2 py-1 text-sm font-medium text-[var(--md3-on-surface-variant)] transition-colors hover:bg-[var(--md3-surface-variant)] hover:text-[var(--md3-primary)]"
                    >
                      {item}
                    </Link>
                  ) : (
                    <span
                      className={`truncate rounded-full px-2 py-1 text-sm ${
                        isLast
                          ? 'font-semibold text-[var(--md3-on-surface)]'
                          : 'font-medium text-[var(--md3-on-surface-variant)]'
                      }`}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {showProgress && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-[var(--md3-on-surface-variant)]">
              {showProgress.current} / {showProgress.total}
            </span>
            <div className="w-[120px] h-1 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--md3-success)] transition-all"
                style={{ width: `${showProgress.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[var(--md3-success)]">
              {showProgress.percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--md3-surface-variant)]" aria-label="Search">
          <Search className="w-6 h-6 text-[var(--md3-on-surface-variant)]" />
        </button>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--md3-surface-variant)]" aria-label="Notifications">
          <Bell className="w-6 h-6 text-[var(--md3-on-surface-variant)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--md3-error)] rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center">
          <span className="text-sm font-medium text-[var(--md3-primary)]">NT</span>
        </div>
      </div>
    </div>
  );
}
