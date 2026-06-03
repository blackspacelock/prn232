import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { Briefcase, ArrowRight, AlertCircle } from 'lucide-react';
import { GET_CAREER_ROLES } from '@/graphql/queries';
import { AppShell, PageHeader } from '../../components/AppShell';
import { PublicLayout } from '../../components/PublicLayout';
import { Skeleton } from '../../components/Skeleton';
import type { CareerRoleDto } from '@/types/api';
import { useCatalogRoutes } from './catalogRoutes';

function RoleGrid({ getDetailPath }: { getDetailPath: (id: string) => string }) {
  const { data, loading, error } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRoleDto[] =
    (data as { careerRoles?: CareerRoleDto[] })?.careerRoles ?? [];

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
        <p className="text-sm text-[var(--md3-on-surface-variant)]">
          Failed to load career roles. Please try again.
        </p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="py-12 text-center">
        <Briefcase className="h-10 w-10 text-[var(--md3-outline)] mx-auto mb-3" />
        <p className="text-sm text-[var(--md3-on-surface-variant)]">
          No career roles available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {roles.map((role) => (
        <Link
          key={role.id}
          to={getDetailPath(role.id)}
          className="md3-card p-6 hover:shadow-md transition-shadow block group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md3-primary-container)]">
              <Briefcase className="h-5 w-5 text-[var(--md3-primary)]" />
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--md3-on-surface-variant)] group-hover:text-[var(--md3-primary)] transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-[var(--md3-on-surface)] mb-2">
            {role.name}
          </h3>
          {role.description && (
            <p className="text-sm text-[var(--md3-on-surface-variant)] line-clamp-2">
              {role.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export function CareerRolesPage() {
  const paths = useCatalogRoutes();

  if (paths.isProtectedCatalog) {
    return (
      <AppShell breadcrumb="Browse Career Roles">
        <div className="app-page">
          <PageHeader
            title="Browse Career Roles"
            description="Explore available career paths and their roadmap templates."
          />
          <RoleGrid getDetailPath={paths.roleDetailPath} />
        </div>
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--md3-on-surface)] mb-2">
            Explore Career Roles
          </h1>
          <p className="text-[var(--md3-on-surface-variant)]">
            Browse available career paths and discover roadmap templates to guide your learning
            journey.
          </p>
        </div>
        <RoleGrid getDetailPath={paths.roleDetailPath} />
      </div>
    </PublicLayout>
  );
}
