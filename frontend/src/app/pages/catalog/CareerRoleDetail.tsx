import { useQuery } from '@apollo/client/react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  Layers,
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
      <AppShell breadcrumb={role?.name ?? 'Career Role'}>
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
              actions={
                <ActionLink
                  icon={ArrowRight}
                  label="View All Roadmaps"
                  to={paths.roleRoadmapsPath(id)}
                  variant="primary"
                  size="md"
                />
              }
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
              <h2 className="text-lg font-semibold text-[var(--md3-on-surface)] mb-4 mt-2">
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--md3-primary-container)]">
                <Layers className="h-6 w-6 text-[var(--md3-primary)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--md3-on-surface)]">{role.name}</h1>
            </div>
            {role.description && (
              <p className="text-[var(--md3-on-surface-variant)]">{role.description}</p>
            )}
            <ActionLink
              icon={ArrowRight}
              label="View All Roadmaps"
              to={paths.roleRoadmapsPath(id)}
              variant="primary"
              size="md"
              className="mt-5"
            />
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
