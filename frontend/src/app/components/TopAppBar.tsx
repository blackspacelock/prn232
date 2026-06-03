import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Bell, ChevronRight, Settings, LogOut } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useAuthStore } from '@/store/authStore';
import { GET_USER_BY_ID } from '@/graphql/queries';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const userId = user?.id ?? '';

  const { data: userData } = useQuery(GET_USER_BY_ID, {
    variables: { userId },
    skip: !userId,
  });

  const fullName: string | undefined = (userData as any)?.userById?.fullName;
  const avatarUrl: string | undefined = (userData as any)?.userById?.avatarUrl;
  const displayName = fullName ?? user?.email ?? '';
  const initials = (() => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return (user?.email?.[0] ?? '?').toUpperCase();
  })();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (dropdownOpen || notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, notifOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    clearAuth();
    navigate('/login', { replace: true });
  };

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
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setDropdownOpen(false); }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--md3-surface-variant)]"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="w-6 h-6 text-[var(--md3-on-surface-variant)]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--md3-error)] rounded-full" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-[var(--md3-outline-variant)] bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-[var(--md3-outline-variant)]">
                <p className="text-sm font-semibold text-[var(--md3-on-surface)]">Notifications</p>
              </div>
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-[var(--md3-outline)]" />
                <p className="text-sm text-[var(--md3-on-surface-variant)]">Coming soon...</p>
              </div>
            </div>
          )}
        </div>

        {/* Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen((o) => !o); setNotifOpen(false); }}
            className="w-9 h-9 rounded-full bg-[var(--md3-primary-container)] overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--md3-primary)] focus:ring-offset-2"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-sm font-medium text-[var(--md3-primary)]">{initials}</span>
            }
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-11 z-50 min-w-[200px] rounded-2xl border border-[var(--md3-outline-variant)] bg-white py-2 shadow-lg">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-[var(--md3-outline-variant)]">
                <p className="text-sm font-semibold text-[var(--md3-on-surface)] truncate">{displayName}</p>
                {user?.email && fullName && (
                  <p className="text-xs text-[var(--md3-on-surface-variant)] truncate mt-0.5">{user.email}</p>
                )}
                <p className="text-xs text-[var(--md3-on-surface-variant)] mt-0.5">{user?.role}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--md3-on-surface)] hover:bg-[var(--md3-surface-variant)] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[var(--md3-on-surface-variant)]" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--md3-error)] hover:bg-[var(--md3-error-container)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
