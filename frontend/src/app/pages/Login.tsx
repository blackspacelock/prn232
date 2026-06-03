import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Compass, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthDrawer } from '../components/AuthDrawer';
import { ActionButton } from '../components/ActionButton';
import { GoogleIcon } from '../components/GoogleIcon';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="flex h-screen bg-[var(--md3-surface-container)]">
      {/* Auth Drawer */}
      <AuthDrawer />

      {/* Form Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="bg-white rounded-3xl p-10 w-full max-w-[480px]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.08)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Compass className="w-8 h-8 text-[var(--md3-primary)]" />
            <span className="text-xl font-bold text-[var(--md3-primary)]">SECompass</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[var(--md3-on-surface)] mb-2">Welcome back</h1>
            <p className="text-sm text-[var(--md3-on-surface-variant)]">Sign in to continue your career journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Sign In Button */}
            <ActionButton
              type="submit"
              icon={LogIn}
              label={isLoading ? 'Signing in...' : 'Sign in'}
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="mt-6 h-12 w-full"
            />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[var(--md3-outline-variant)]" />
              <span className="text-xs text-[var(--md3-on-surface-variant)]">OR</span>
              <div className="flex-1 h-px bg-[var(--md3-outline-variant)]" />
            </div>

            {/* Google Button */}
            <ActionButton
              type="button"
              icon={GoogleIcon}
              label="Continue with Google"
              variant="neutral"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="h-12 w-full text-[var(--md3-on-surface)]"
            />
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[var(--md3-on-surface-variant)] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[var(--md3-primary)] hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
