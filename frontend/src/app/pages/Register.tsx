import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Compass, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin } from '@react-oauth/google';
import { AuthDrawer } from '../components/AuthDrawer';
import { ActionButton } from '../components/ActionButton';
import { Snackbar } from '../components/Snackbar';
import { PublicLayout } from '../components/PublicLayout';
import { apiClient } from '@/lib/axios';
import { mapAuthResponse } from '@/lib/authMapper';
import { getRoleHomePath } from '@/lib/authRedirect';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponseDto, GoogleLoginDto, RegisterUserDto } from '@/types/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const showError = (message: string) => setSnackbar({ open: true, message });

  const getPasswordStrength = (password: string): { level: 0 | 1 | 2 | 3 | 4; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Weak', color: 'var(--md3-error)' };
    if (password.length < 10) return { level: 2, label: 'Fair', color: 'var(--md3-warning)' };
    if (password.length < 14) return { level: 3, label: 'Good', color: '#FBBC04' };
    return { level: 4, label: 'Strong', color: 'var(--md3-success)' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const registerMutation = useMutation({
    mutationFn: (dto: RegisterUserDto) =>
      apiClient.post<AuthResponseDto>('/api/auth/register', dto).then((r) => r.data),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = mapAuthResponse(data);
      setAuth(accessToken, user, refreshToken);
      navigate(getRoleHomePath(user.role), { replace: true });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      showError(msg);
    },
  });

  const googleMutation = useMutation({
    mutationFn: (dto: GoogleLoginDto) =>
      apiClient.post<AuthResponseDto>('/api/auth/google', dto).then((r) => r.data),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = mapAuthResponse(data);
      setAuth(accessToken, user, refreshToken);
      navigate(getRoleHomePath(user.role), { replace: true });
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
    registerMutation.mutate({ email: formData.email, password: formData.password, fullName: formData.name });
  };

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
            <h1 className="text-3xl font-semibold text-[var(--md3-on-surface)] mb-2">Create your account</h1>
            <p className="text-sm text-[var(--md3-on-surface-variant)]">Start your journey to becoming job-ready</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--md3-primary)] text-white flex items-center justify-center text-sm font-medium">1</div>
              <span className="text-xs font-medium text-[var(--md3-primary)]">Account</span>
            </div>
            <div className="flex-1 h-px bg-[var(--md3-outline)]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] flex items-center justify-center text-sm font-medium">2</div>
              <span className="text-xs font-medium text-[var(--md3-on-surface-variant)]">Profile</span>
            </div>
            <div className="flex-1 h-px bg-[var(--md3-outline)]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] flex items-center justify-center text-sm font-medium">3</div>
              <span className="text-xs font-medium text-[var(--md3-on-surface-variant)]">Done</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                className="md3-field w-full pl-12 pr-4 text-base"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                className="md3-field w-full pl-12 pr-4 text-base"
                required
              />
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create password"
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

              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((segment) => (
                      <div
                        key={segment}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{ backgroundColor: segment <= passwordStrength.level ? passwordStrength.color : 'var(--md3-outline-variant)' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <ActionButton
              type="submit"
              icon={ArrowRight}
              label={registerMutation.isPending ? 'Creating account...' : 'Continue'}
              variant="primary"
              size="lg"
              disabled={registerMutation.isPending}
              className="mt-6 h-12 w-full"
            />
          </form>

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

          <p className="text-center text-sm text-[var(--md3-on-surface-variant)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[var(--md3-primary)] hover:underline">
              Sign in
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
