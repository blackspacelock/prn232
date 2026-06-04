import { useQuery } from '@apollo/client/react';
import { Link, useParams } from 'react-router';
import {
  AlertCircle,
  ChevronLeft,
  Layers,
  Map,
  Route,
} from 'lucide-react';
import { GET_CAREER_ROLES } from '@/graphql/queries';
import { AppShell, PageHeader } from '../../components/AppShell';
import { PublicLayout } from '../../components/PublicLayout';
import { Skeleton } from '../../components/Skeleton';
import { ActionLink } from '../../components/ActionButton';
import type { CareerRoleDto } from '@/types/api';
import { CatalogRoadmapList } from './CatalogRoadmapList';
import { useCatalogRoutes } from './catalogRoutes';

export function CareerRoleDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const paths = useCatalogRoutes();

  const { data: rolesData, loading: rolesLoading, error: rolesError } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRoleDto[] =
    (rolesData as { careerRoles?: CareerRoleDto[] })?.careerRoles ?? [];
  const role = roles.find((r) => r.id === id);

  if (paths.isProtectedCatalog) {
    return (
      <AppShell
        breadcrumb="Career Roles / Role"
        breadcrumbs={[
          { label: 'Career Roles', to: paths.roleListPath },
          { label: role?.name ?? 'Career Role' },
        ]}
      >
        <div className="app-page">
          <div className="mb-4">
            <Link
              to={paths.roleListPath}
              className="inline-flex items-center gap-1 text-sm text-[var(--md3-primary)] hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              All Career Roles
            </Link>
          </div>

          {rolesLoading ? (
            <div className="space-y-3 mb-8">
              <Skeleton className="h-8 w-64 rounded" />
              <Skeleton className="h-4 w-full max-w-md rounded" />
            </div>
          ) : rolesError ? (
            <div className="py-8 text-center">
              <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
              <p className="text-[var(--md3-on-surface-variant)]">Failed to load career role.</p>
            </div>
          ) : role ? (
            <PageHeader
              title={role.name}
              description={role.description ?? ''}
            />
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

          {role && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md3-primary-container)]">
                    <Route className="h-5 w-5 text-[var(--md3-primary)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--md3-on-surface)]">Role Track</p>
                  <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                    {role.name}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--md3-outline-variant)] bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md3-primary-container)]">
                    <Map className="h-5 w-5 text-[var(--md3-primary)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--md3-on-surface)]">Templates</p>
                  <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                    Curated roadmaps for this role
                  </p>
                </div>
              </div>
              <h2 className="mb-4 mt-2 text-lg font-semibold text-[var(--md3-on-surface)]">
                Roadmap Templates
              </h2>
              <CatalogRoadmapList
                roleId={id}
                getRoadmapDetailPath={paths.roadmapDetailPath}
                limit={3}
              />
            </>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-4">
          <Link
            to={paths.roleListPath}
            className="inline-flex items-center gap-1 text-sm text-[var(--md3-primary)] hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            All Career Roles
          </Link>
        </div>

        {rolesLoading ? (
          <div className="space-y-3 mb-8">
            <Skeleton className="h-8 w-64 rounded" />
            <Skeleton className="h-4 w-full max-w-md rounded" />
          </div>
        ) : rolesError ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
            <p className="text-[var(--md3-on-surface-variant)]">Failed to load career role.</p>
          </div>
        ) : role ? (
          <div className="mb-8 rounded-lg border border-[var(--md3-outline-variant)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--md3-primary-container)]">
                <Layers className="h-6 w-6 text-[var(--md3-primary)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight text-[var(--md3-on-surface)]">{role.name}</h1>
                <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">Career role</p>
              </div>
            </div>
            {role.description && (
              <p className="max-w-3xl text-sm leading-6 text-[var(--md3-on-surface-variant)]">{role.description}</p>
            )}
          </div>
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

        {role && (
          <>
            <h2 className="text-lg font-semibold text-[var(--md3-on-surface)] mb-4">
              Roadmap Templates
            </h2>
            <CatalogRoadmapList
              roleId={id}
              getRoadmapDetailPath={paths.roadmapDetailPath}
              limit={3}
            />
          </>
        )}
      </div>
    </PublicLayout>
  );
}
