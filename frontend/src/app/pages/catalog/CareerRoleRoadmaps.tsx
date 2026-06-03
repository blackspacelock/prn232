import { useQuery } from '@apollo/client/react';
import { Link, useParams } from 'react-router';
import { AlertCircle, ChevronLeft, Layers, Route } from 'lucide-react';
import { GET_CAREER_ROLES } from '@/graphql/queries';
import { AppShell, PageHeader } from '../../components/AppShell';
import { PublicLayout } from '../../components/PublicLayout';
import { Skeleton } from '../../components/Skeleton';
import { ActionLink } from '../../components/ActionButton';
import type { CareerRoleDto } from '@/types/api';
import { CatalogRoadmapList } from './CatalogRoadmapList';
import { useCatalogRoutes } from './catalogRoutes';

export function CareerRoleRoadmapsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const paths = useCatalogRoutes();
  const { data, loading, error } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRoleDto[] = (data as { careerRoles?: CareerRoleDto[] })?.careerRoles ?? [];
  const role = roles.find((r) => r.id === id);

  const body = (
    <>
      <div className="mb-4">
        <Link
          to={paths.roleDetailPath(id)}
          className="inline-flex items-center gap-1 text-sm text-[var(--md3-primary)] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Career Role Details
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-4 w-full max-w-md rounded" />
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
          <p className="text-[var(--md3-on-surface-variant)]">Failed to load career role.</p>
        </div>
      ) : role ? (
        <>
          {paths.isProtectedCatalog ? (
            <PageHeader
              title={`${role.name} Roadmaps`}
              description={role.description ?? 'Choose a roadmap template for this career role.'}
            />
          ) : (
            <div className="mb-8 rounded-lg border border-[var(--md3-outline-variant)] bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--md3-primary-container)]">
                  <Route className="h-6 w-6 text-[var(--md3-primary)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-[var(--md3-on-surface)]">
                    {role.name} Roadmaps
                  </h1>
                  <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">Templates</p>
                </div>
              </div>
              {role.description && (
                <p className="max-w-3xl text-sm leading-6 text-[var(--md3-on-surface-variant)]">{role.description}</p>
              )}
            </div>
          )}
          <CatalogRoadmapList roleId={id} getRoadmapDetailPath={paths.roadmapDetailPath} />
        </>
      ) : (
        <div className="py-8 text-center">
          <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
          <p className="text-[var(--md3-on-surface-variant)]">Career role not found.</p>
          <ActionLink
            icon={ChevronLeft}
            label="Back to Career Roles"
            to={paths.roleListPath}
            variant="tonal"
            size="md"
            className="mt-4"
          />
        </div>
      )}
    </>
  );

  if (paths.isProtectedCatalog) {
    return (
      <AppShell
        breadcrumb="Career Roles / Roadmaps"
        breadcrumbs={[
          { label: 'Career Roles', to: paths.roleListPath },
          { label: role?.name ?? 'Role', to: role ? paths.roleDetailPath(role.id) : undefined },
          { label: 'Roadmaps' },
        ]}
      >
        <div className="app-page">{body}</div>
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md3-primary-container)]">
          <Layers className="h-5 w-5 text-[var(--md3-primary)]" />
        </div>
        {body}
      </div>
    </PublicLayout>
  );
}
