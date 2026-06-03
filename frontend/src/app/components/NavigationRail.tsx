import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Map,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Briefcase,
  Compass,
  Settings,
  ShieldCheck,
  Route,
  Network,
  Database
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Roadmaps', path: '/roadmaps' },
  { icon: MessageSquare, label: 'AI Mentor', path: '/mentor' },
  { icon: BarChart3, label: 'Skill Gap', path: '/skill-gap' },
  { icon: TrendingUp, label: 'Market Pulse', path: '/market' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
];

const adminItems: NavItem[] = [
  { icon: ShieldCheck, label: 'Roles', path: '/admin/career-roles' },
  { icon: Route, label: 'Templates', path: '/admin/roadmaps' },
  { icon: Network, label: 'Nodes', path: '/admin/nodes' },
  { icon: Database, label: 'Trends', path: '/admin/job-trends' },
];

export function NavigationRail() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-56 flex-col border-r border-[var(--md3-outline-variant)] bg-white px-4 py-4 md:flex">
      {/* Logo */}
      <Link to="/dashboard" className="mb-5 flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-[var(--md3-surface-variant)]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--md3-primary-container)]">
          <Compass className="h-6 w-6 text-[var(--md3-primary)]" />
        </div>
        <div className="min-w-0">
          <span className="block text-base font-semibold leading-tight text-[var(--md3-primary)]">SECompass</span>
          <span className="block truncate text-[11px] font-medium text-[var(--md3-on-surface-variant)]">Career workspace</span>
        </div>
      </Link>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto">
        {[...navItems, ...adminItems].map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/roadmaps' && location.pathname.startsWith('/roadmap/'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                ${index === navItems.length ? 'mt-3 border-t border-[var(--md3-outline-variant)] pt-3' : ''}
                group flex min-h-11 items-center gap-3 rounded-full px-3 py-2 transition-colors
                ${isActive
                  ? 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
                  : 'text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-white/70' : 'group-hover:bg-white'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className={`truncate text-sm leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Avatar & Settings */}
      <div className="flex flex-col gap-2 border-t border-[var(--md3-outline-variant)] pt-4">
        <Link
          to="/settings"
          className={`
            flex min-h-11 items-center gap-3 rounded-full px-3 py-2 transition-colors
            ${location.pathname === '/settings'
              ? 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
              : 'text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-variant)]'
            }
          `}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70">
            <Settings className="w-5 h-5" />
          </span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--md3-surface-container)] px-3 py-3">
          <div className="w-9 h-9 rounded-full bg-[var(--md3-primary-container)] flex shrink-0 items-center justify-center">
            <span className="text-sm font-medium text-[var(--md3-primary)]">NT</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">Nguyen Thanh</p>
            <p className="truncate text-[11px] text-[var(--md3-on-surface-variant)]">Student</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
