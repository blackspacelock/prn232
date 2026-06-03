import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  role: 'Student' | 'Mentor' | 'Admin';
  profileId: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  _initialized: boolean;
}

interface AuthActions {
  setAuth: (accessToken: string, user: AuthUser, refreshToken?: string) => void;
  clearAuth: () => void;
  initFromStorage: () => void;
}

export type AuthStore = AuthState & AuthActions;

const REFRESH_TOKEN_KEY = 'secompass_rt';

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  _initialized: false,

  setAuth: (accessToken, user, refreshToken) => {
    if (refreshToken && import.meta.env.DEV) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    set({ accessToken, user, isAuthenticated: true });
  },

  clearAuth: () => {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    set({ _initialized: true });
  },
}));

export const getRefreshToken = (): string | null =>
  sessionStorage.getItem(REFRESH_TOKEN_KEY);
