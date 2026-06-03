import { useLocation } from 'react-router';

export function useCatalogRoutes() {
  const location = useLocation();
  const isProtectedCatalog =
    location.pathname.startsWith('/app/') || location.pathname.startsWith('/browse/');
  const roleBasePath = isProtectedCatalog ? '/app/career-roles' : '/career-roles';
  const roadmapBasePath = isProtectedCatalog ? '/app/roadmaps' : '/roadmaps';

  return {
    isProtectedCatalog,
    roleListPath: roleBasePath,
    roleDetailPath: (id: string) => `${roleBasePath}/${id}`,
    roleRoadmapsPath: (id: string) => `${roleBasePath}/${id}/roadmaps`,
    roadmapDetailPath: (id: string) => `${roadmapBasePath}/${id}`,
  };
}
