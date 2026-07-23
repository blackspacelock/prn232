import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { Briefcase, ArrowRight, AlertCircle, Map, Route } from 'lucide-react';
import { GET_CAREER_ROLES } from '@/graphql/queries';
import { AppShell, PageHeader } from '../../components/AppShell';
import { PublicLayout } from '../../components/PublicLayout';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';
import { Skeleton } from '../../components/Skeleton';
import {
  AdminListToolbar,
  AdminPagination,
  useAdminList,
  type AdminSortOption,
} from '../../components/admin/AdminListControls';
import type { CareerRoleDto } from '@/types/api';
import { useCatalogRoutes } from './catalogRoutes';

type RoleSort = 'name' | 'createdAt';

const SORT_OPTIONS: AdminSortOption<RoleSort>[] = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Date Added' },
];

function RoleGrid({ getDetailPath }: { getDetailPath: (id: string) => string }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RoleSort>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, loading, error } = useQuery(GET_CAREER_ROLES);
  const roles: CareerRoleDto[] = (data as { careerRoles?: CareerRoleDto[] })?.careerRoles ?? [];

  const roleList = useAdminList<CareerRoleDto, RoleSort>({
    items: roles,
    searchText: search,
    sortKey,
    sortDirection,
    pageSize: 20,
    searchPredicate: (role, term) =>
      `${role.name} ${role.description ?? ''}`.toLowerCase().includes(term),
    getSortValue: (role, key) => {
      if (key === 'name') return role.name;
      return role.createdAt;
    },
  });

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
    <div className="space-y-4">
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search career roles..."
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        sortOptions={SORT_OPTIONS}
      />

      {roleList.pagedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--md3-outline)] bg-white py-10 text-center">
          <Briefcase className="mx-auto mb-3 h-8 w-8 text-[var(--md3-outline)]" />
          <p className="text-sm text-[var(--md3-on-surface-variant)]">
            No roles match your search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleList.pagedItems.map((role, index) => (
              <Link
                key={role.id}
                to={getDetailPath(role.id)}
                className="group flex min-h-[188px] flex-col justify-between rounded-lg border border-[var(--md3-outline-variant)] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--md3-status-in-progress-stroke)] hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--md3-primary-container)]">
                      <Briefcase className="h-5 w-5 text-[var(--md3-primary)]" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--md3-surface-container)] px-2 py-1 text-xs font-medium text-[var(--md3-on-surface-variant)]">
                      <Route className="h-3.5 w-3.5" />
                      Path {roleList.startItem + index}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-tight text-[var(--md3-on-surface)]">
                    {role.name}
                  </h3>
                  {role.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
                      {role.description}
                    </p>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--md3-outline-variant)] pt-4">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--md3-primary)]">
                    <Map className="h-4 w-4" />
                    Roadmaps
                  </span>
                  <ArrowRight className="h-5 w-5 text-[var(--md3-on-surface-variant)] transition-colors group-hover:text-[var(--md3-primary)]" />
                </div>
              </Link>
            ))}
          </div>
          <AdminPagination {...roleList} onPageChange={roleList.setPage} />
        </>
      )}
    </div>
  );
}

export function CareerRolesPage() {
  const paths = useCatalogRoutes();

  if (paths.isProtectedCatalog) {
    return (
      <AppShell
        breadcrumb="Career Roles"
        breadcrumbs={[{ label: 'Career Roles' }]}
      >
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
        <div className="mb-5">
          <AppBreadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Browse Roles' }]} />
        </div>
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
