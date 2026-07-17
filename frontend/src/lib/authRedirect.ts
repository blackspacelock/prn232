import type { AuthUser } from '@/store/authStore';

export function getRoleHomePath(role?: AuthUser['role'] | string | null) {
  return role === 'Admin' ? '/admin' : '/dashboard';
}

export function getPostAuthRedirect(role: AuthUser['role'], from?: string) {
  if (!from || from === '/login' || from === '/register') {
    return getRoleHomePath(role);
  }

  if (role === 'Admin' && from === '/dashboard') {
    return '/admin';
  }

  return from;
}
