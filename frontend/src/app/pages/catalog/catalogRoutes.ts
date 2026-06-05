import { useLocation } from 'react-router';

export function useCatalogRoutes() {
  const location = useLocation();
  const isPublicCatalog = location.pathname.startsWith('/explore/');
  const roleBasePath = isPublicCatalog ? '/explore/career-roles' : '/career-roles';
  const roadmapBasePath = isPublicCatalog ? '/explore/roadmaps' : '/roadmaps';

  return {
    isProtectedCatalog: !isPublicCatalog,
    roleListPath: roleBasePath,
    roleDetailPath: (id: string) => `${roleBasePath}/${id}`,
    roadmapDetailPath: (id: string) => `${roadmapBasePath}/${id}`,
  };
}
