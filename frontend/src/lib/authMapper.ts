import type { AuthResponseDto } from '@/types/api';
import type { AuthUser } from '@/store/authStore';

function mapRole(role: number): AuthUser['role'] {
  if (role === 0) return 'Admin';
  if (role === 1) return 'Mentor';
  return 'Student';
}

export function mapAuthResponse(dto: AuthResponseDto): { user: AuthUser; accessToken: string; refreshToken: string } {
  const user: AuthUser = {
    id: dto.userId,
    email: dto.email,
    role: mapRole(dto.role),
    profileId: dto.userId,
  };
  return { user, accessToken: dto.accessToken, refreshToken: dto.refreshToken };
}
