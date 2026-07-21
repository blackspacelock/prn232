import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Bell, Settings, LogOut } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useAuthStore } from '@/store/authStore';
import { GET_USER_BY_ID } from '@/graphql/queries';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { breadcrumbStringToItems, type BreadcrumbItem } from './breadcrumbs';

interface TopAppBarProps {
  breadcrumb: string;
  breadcrumbs?: BreadcrumbItem[];
  showProgress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface UserByIdQuery {
  userById?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function TopAppBar({ breadcrumb, breadcrumbs, showProgress }: TopAppBarProps) {
  const breadcrumbItems = breadcrumbs ?? breadcrumbStringToItems(breadcrumb);
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

  const fullName: string | undefined =
    (userData as UserByIdQuery | undefined)?.userById?.fullName ?? undefined;
  const avatarUrl: string | undefined =
    (userData as UserByIdQuery | undefined)?.userById?.avatarUrl ?? undefined;
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
        <AppBreadcrumbs items={breadcrumbItems} />

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
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setDropdownOpen(false); }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--md3-surface-variant)]"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="w-6 h-6 text-[var(--md3-on-surface-variant)]" />
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
