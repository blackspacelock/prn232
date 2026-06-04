import { Navigate, useParams } from 'react-router';

export function PublicLegacyRoadmapRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/explore/roadmaps/${id ?? ''}`} replace />;
}

export function AuthCareerRolesRedirect() {
  return <Navigate to="/career-roles" replace />;
}

export function AuthCareerRoleDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/career-roles/${id ?? ''}`} replace />;
}

export function AuthRoadmapRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/roadmaps/${id ?? ''}`} replace />;
}
