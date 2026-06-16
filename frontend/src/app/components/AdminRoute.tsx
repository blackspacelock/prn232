import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from './Skeleton';

export function AdminRoute() {
  const { isAuthenticated, user, _initialized } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  if (!_initialized) return <Skeleton className="h-screen w-full" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
