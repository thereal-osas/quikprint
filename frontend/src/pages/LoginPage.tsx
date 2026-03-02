import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLogin, useVerifyTwoFactor } from '@/hooks/useApi';
import { ApiError } from '@/services/api';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFASessionId, setTwoFASessionId] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState('');

  const loginMutation = useLogin();
  const verifyTwoFactorMutation = useVerifyTwoFactor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await loginMutation.mutateAsync({ email, password });

      // Check if 2FA is required
      if (response.requiresTwoFA && response.twoFASessionId) {
        setTwoFASessionId(response.twoFASessionId);
        setShowTwoFactor(true);
        return;
      }

      toast.success('Welcome back!');

      // Redirect based on user role
      if (response.user?.role === 'admin' || response.user?.role === 'manager') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!twoFASessionId) {
      setError('Session expired. Please login again.');
      setShowTwoFactor(false);
      return;
    }

    try {
      const response = await verifyTwoFactorMutation.mutateAsync({
        sessionId: twoFASessionId,
        code: twoFACode,
      });

      toast.success('Welcome back!');

      // Redirect based on user role
      if (response.user?.role === 'admin' || response.user?.role === 'manager') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setTwoFASessionId(null);
    setTwoFACode('');
    setError(null);
  };

  // 2FA Verification Form
  if (showTwoFactor) {
    return (
      <Layout>
        <div className="container-main section-padding">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Two-Factor Authentication
              </h1>
              <p className="text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <form onSubmit={handleTwoFactorSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  disabled={verifyTwoFactorMutation.isPending}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full"
                disabled={verifyTwoFactorMutation.isPending || twoFACode.length !== 6}
              >
                {verifyTwoFactorMutation.isPending ? 'Verifying...' : 'Verify'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
                disabled={verifyTwoFactorMutation.isPending}
              >
                Back to Login
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // Login Form
  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sign In to Your Account
            </h1>
            <p className="text-muted-foreground">
              Access your orders, saved designs, and more
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
