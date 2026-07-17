import { Link, useLocation, useNavigate } from 'react-router';
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
  Code2,
  BookOpen,
  Database,
  Telescope,
  Users,
  ClipboardList,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Roadmaps', path: '/roadmaps' },
  { icon: Telescope, label: 'Browse Roles', path: '/career-roles' },
  { icon: MessageSquare, label: 'AI Mentor', path: '/mentor' },
  { icon: BarChart3, label: 'Skill Gap', path: '/skill-gap' },
  { icon: TrendingUp, label: 'Market Pulse', path: '/market' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
];

const adminItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: ShieldCheck, label: 'Career Roles', path: '/admin/career-roles' },
  { icon: Route, label: 'Templates', path: '/admin/roadmaps' },
  { icon: Network, label: 'Nodes', path: '/admin/nodes' },
  { icon: Code2, label: 'Skills', path: '/admin/technical-skills' },
  { icon: BookOpen, label: 'Resources', path: '/admin/learning-resources' },
  { icon: Database, label: 'Trends', path: '/admin/job-trends' },
  { icon: SlidersHorizontal, label: 'Config', path: '/admin/config' },
  { icon: ClipboardList, label: 'Reports', path: '/admin/reports' },
];

export function NavigationRail() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const role = user?.role ?? '';
  const isAdmin = role === 'Admin';
  const isAdminSection = location.pathname.startsWith('/admin');

  const visibleItems = isAdmin && isAdminSection ? adminItems : navItems;
  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-56 flex-col border-r border-[var(--md3-outline-variant)] bg-white px-4 py-4 md:flex">
      {/* Logo */}
      <div className="mb-5 flex items-center gap-3 px-3 py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--md3-primary-container)]">
          <Compass className="h-6 w-6 text-[var(--md3-primary)]" />
        </div>
        <div className="min-w-0">
          <span className="block text-base font-semibold leading-tight text-[var(--md3-primary)]">SECompass</span>
          <span className="block truncate text-[11px] font-medium text-[var(--md3-on-surface-variant)]">Career workspace</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/admin' && location.pathname === '/admin') ||
            (item.path === '/roadmaps' && location.pathname.startsWith('/roadmap/')) ||
            (item.path === '/career-roles' &&
              (location.pathname.startsWith('/career-roles') ||
                location.pathname.startsWith('/app/career-roles') ||
                location.pathname.startsWith('/app/roadmaps') ||
                location.pathname.startsWith('/browse/career-roles') ||
                location.pathname.startsWith('/browse/career-roadmap')));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
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

      {/* Settings & Logout */}
      <div className="flex flex-col gap-2 border-t border-[var(--md3-outline-variant)] pt-4">
        {!isAdminSection && (
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
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-full px-3 py-2 text-[var(--md3-error)] transition-colors hover:bg-[var(--md3-error-container)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
