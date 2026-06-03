import type { ReactNode } from 'react';
import { NavigationRail } from './NavigationRail';
import { TopAppBar } from './TopAppBar';

interface AppShellProps {
  breadcrumb: string;
  children: ReactNode;
  className?: string;
  showProgress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

export function AppShell({ breadcrumb, children, className = '', showProgress }: AppShellProps) {
  return (
    <div className="app-shell">
      <NavigationRail />
      <TopAppBar breadcrumb={breadcrumb} showProgress={showProgress} />
      <main className={`app-main ${className}`}>{children}</main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="app-page-header">
      <div>
        <h1 className="app-page-title">{title}</h1>
        <p className="app-page-subtitle">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
