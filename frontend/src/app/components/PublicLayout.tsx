import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Compass, LogIn, ArrowRight } from 'lucide-react';
import { ActionLink } from './ActionButton';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[var(--md3-outline-variant)] z-50 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-[var(--md3-primary)]" />
            <span className="text-xl font-bold text-[var(--md3-primary)]">SECompass</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/explore/career-roles"
              className="hidden text-sm font-medium text-[var(--md3-on-surface-variant)] transition-colors hover:text-[var(--md3-primary)] sm:inline-flex"
            >
              Browse Roles
            </Link>
            <ActionLink icon={LogIn} label="Sign in" to="/login" variant="text" size="md" />
            <ActionLink icon={ArrowRight} label="Get started free" to="/register" variant="primary" size="md" />
          </div>
        </div>
      </nav>
      <div className="pt-16">{children}</div>
    </div>
  );
}
