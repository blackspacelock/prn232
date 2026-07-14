import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, Compass, LayoutDashboard, LogIn } from 'lucide-react';
import { ActionLink } from './ActionButton';
import { useAuthStore } from '@/store/authStore';

interface PublicLayoutProps {
  children: ReactNode;
  className?: string;
}

const publicNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Browse Roles', to: '/explore/career-roles' },
];

export function PublicLayout({
  children,
  className = '',
}: PublicLayoutProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[var(--md3-outline-variant)] z-50 shadow-sm">
        <div className="h-full w-full px-6 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-8">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <Compass className="w-6 h-6 text-[var(--md3-primary)]" />
              <span className="text-xl font-bold text-[var(--md3-primary)]">SECompass</span>
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              {publicNavItems.map((item) => {
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[var(--md3-primary)]'
                        : 'text-[var(--md3-on-surface-variant)] hover:text-[var(--md3-primary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <ActionLink icon={LayoutDashboard} label="Go to Dashboard" to="/dashboard" variant="primary" size="md" />
            ) : (
              <>
                <ActionLink icon={LogIn} label="Sign in" to="/login" variant="text" size="md" />
                <ActionLink icon={ArrowRight} label="Get started free" to="/register" variant="primary" size="md" />
              </>
            )}
          </div>
        </div>
      </nav>
      <div className={`pt-16 ${className}`}>
        {children}
      </div>
    </div>
  );
}
