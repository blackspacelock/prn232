import axios from 'axios';
import { useAuthStore, getRefreshToken } from '@/store/authStore';
import { mapAuthResponse } from '@/lib/authMapper';
import type { AuthResponseDto } from '@/types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

export const deleteWithCascadeMode = (url: string, useDelete = true) =>
  apiClient.delete(url, { params: useDelete ? { delete: true } : undefined });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          const rt = getRefreshToken();
          refreshPromise = apiClient
            .post<AuthResponseDto>('/api/auth/refresh', { refreshToken: rt })
            .then((res) => {
              const { user, accessToken, refreshToken } = mapAuthResponse(res.data);
              useAuthStore.getState().setAuth(accessToken, user, refreshToken);
              return accessToken;
            })
            .finally(() => { refreshPromise = null; });
        }
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
