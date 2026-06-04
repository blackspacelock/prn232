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

const ACCESS_TOKEN_KEY = 'secompass_at';
const USER_KEY = 'secompass_user';
const REFRESH_TOKEN_KEY = 'secompass_rt';

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  _initialized: false,

  setAuth: (accessToken, user, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    set({ accessToken, user, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        set({ accessToken: token, user, isAuthenticated: true, _initialized: true });
        return;
      } catch {
        // corrupt data — fall through to clear
      }
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ _initialized: true });
  },
}));

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);
