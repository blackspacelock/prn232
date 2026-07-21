import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router';
import { Compass, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin } from '@react-oauth/google';
import { AuthDrawer } from '../components/AuthDrawer';
import { ActionButton } from '../components/ActionButton';
import { Snackbar } from '../components/Snackbar';
import { PublicLayout } from '../components/PublicLayout';
import { apiClient } from '@/lib/axios';
import { mapAuthResponse } from '@/lib/authMapper';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponseDto, LoginUserDto, GoogleLoginDto } from '@/types/api';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, _initialized, user } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as { from?: string })?.from;
  const getDefaultRedirect = (role: string) => (role === 'Admin' ? '/admin' : '/dashboard');

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const showError = (message: string) => setSnackbar({ open: true, message });

  const loginMutation = useMutation({
    mutationFn: (dto: LoginUserDto) =>
      apiClient.post<AuthResponseDto>('/api/auth/login', dto).then((r) => r.data),
    onSuccess: (data) => {
      const { user: mappedUser, accessToken, refreshToken } = mapAuthResponse(data);
      setAuth(accessToken, mappedUser, refreshToken);
      navigate(from ?? getDefaultRedirect(mappedUser.role), { replace: true });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      showError(msg);
    },
  });

  const googleMutation = useMutation({
    mutationFn: (dto: GoogleLoginDto) =>
      apiClient.post<AuthResponseDto>('/api/auth/google', dto).then((r) => r.data),
    onSuccess: (data) => {
      const { user: mappedUser, accessToken, refreshToken } = mapAuthResponse(data);
      setAuth(accessToken, mappedUser, refreshToken);
      navigate(from ?? getDefaultRedirect(mappedUser.role), { replace: true });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Google sign-in failed.';
      showError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  if (_initialized && isAuthenticated) {
    return <Navigate to={from ?? getDefaultRedirect(user?.role ?? '')} replace />;
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-64px)] bg-[var(--md3-surface-container)]">
        <AuthDrawer />

        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="bg-white rounded-3xl p-10 w-full max-w-[480px]"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Compass className="w-8 h-8 text-[var(--md3-primary)]" />
              <span className="text-xl font-bold text-[var(--md3-primary)]">SECompass</span>
            </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[var(--md3-on-surface)] mb-2">Welcome back</h1>
            <p className="text-sm text-[var(--md3-on-surface-variant)]">Sign in to continue your career journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="md3-field w-full pl-12 pr-4 text-base"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-end mb-1">
                <a href="#" className="text-sm font-medium text-[var(--md3-primary)] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="md3-field w-full pl-12 pr-12 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md3-on-surface-variant)] hover:text-[var(--md3-on-surface)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <ActionButton
              type="submit"
              icon={LogIn}
              label={loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              variant="primary"
              size="lg"
              disabled={loginMutation.isPending}
              className="mt-6 h-12 w-full"
            />

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[var(--md3-outline-variant)]" />
              <span className="text-xs text-[var(--md3-on-surface-variant)]">OR</span>
              <div className="flex-1 h-px bg-[var(--md3-outline-variant)]" />
            </div>

            <div className="flex h-12 w-full justify-center overflow-hidden [&>div]:h-12 [&>div]:w-full [&_iframe]:h-10 [&_iframe]:w-full [&_iframe]:origin-top [&_iframe]:scale-y-[1.2]">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    googleMutation.mutate({ idToken: credentialResponse.credential });
                  }
                }}
                onError={() => showError('Google sign-in failed.')}
                shape="pill"
                size="large"
                text="continue_with"
                width="400"
              />
            </div>
          </form>

          <p className="text-center text-sm text-[var(--md3-on-surface-variant)] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[var(--md3-primary)] hover:underline">
              Create account
            </Link>
          </p>
          </div>
        </div>

        <Snackbar
          isOpen={snackbar.open}
          message={snackbar.message}
          variant="error"
          onClose={() => setSnackbar({ open: false, message: '' })}
        />
      </div>
    </PublicLayout>
  );
}
