import type { AuthUser } from '@/store/authStore';

export function getRoleHomePath(role?: AuthUser['role'] | string | null) {
  return role === 'Admin' ? '/admin' : '/dashboard';
}

export function getPostAuthRedirect(role: AuthUser['role'], from?: string) {
  if (!from || from === '/login' || from === '/register' || !from.startsWith('/')) {
    return getRoleHomePath(role);
  }

  if (role === 'Admin') {
    return from.startsWith('/admin') ? from : '/admin';
  }

  if (from.startsWith('/admin')) {
    return getRoleHomePath(role);
  }

  return from;
}
