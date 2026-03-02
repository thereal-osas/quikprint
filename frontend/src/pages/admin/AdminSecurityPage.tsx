import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useUser,
  useTwoFactorSetup,
  useEnableTwoFactor,
  useDisableTwoFactor,
} from '@/hooks/useApi';
import { ApiError } from '@/services/api';
import { ShieldCheck, ShieldOff, Loader2, QrCode, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminSecurityPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const setupMutation = useTwoFactorSetup();
  const enableMutation = useEnableTwoFactor();
  const disableMutation = useDisableTwoFactor();

  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const is2FAEnabled = user?.twoFactorEnabled ?? false;

  // Check if user has permission to access this page
  if (!userLoading && user?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access Security settings. This feature is restricted to administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSetup = async () => {
    try {
      const data = await setupMutation.mutateAsync();
      setSetupData(data);
      setVerificationCode('');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to generate 2FA setup');
      }
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enableMutation.mutateAsync({ code: verificationCode });
      toast.success('Two-factor authentication enabled!');
      setSetupData(null);
      setVerificationCode('');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to enable 2FA');
      }
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await disableMutation.mutateAsync({ code: disableCode });
      toast.success('Two-factor authentication disabled');
      setDisableCode('');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to disable 2FA');
      }
    }
  };

  const copySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and two-factor authentication
          </p>
        </div>

        {/* 2FA Status Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${is2FAEnabled ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {is2FAEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {is2FAEnabled
                    ? 'Your account is protected with 2FA. You will need your authenticator app to log in.'
                    : 'Add an extra layer of security to your account by enabling two-factor authentication.'}
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    is2FAEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {is2FAEnabled ? 'Enabled' : 'Not Enabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enable 2FA Section */}
          {!is2FAEnabled && !setupData && (
            <div className="mt-6 pt-6 border-t border-border">
              <Button onClick={handleSetup} disabled={setupMutation.isPending}>
                {setupMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</>
                ) : (
                  <><QrCode className="w-4 h-4 mr-2" /> Set Up 2FA</>
                )}
              </Button>
            </div>
          )}

          {/* QR Code Setup */}
          {!is2FAEnabled && setupData && (
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">1. Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Google Authenticator, Authy, or any TOTP app to scan:
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-border inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUrl)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">2. Or Enter Manually</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Can't scan? Enter this secret key manually:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1 break-all">
                        {setupData.secret}
                      </code>
                      <Button variant="outline" size="sm" onClick={copySecret}>
                        {copiedSecret ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleEnable} className="space-y-4">
                    <div>
                      <Label htmlFor="verifyCode">3. Enter Verification Code</Label>
                      <Input
                        id="verifyCode"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={enableMutation.isPending || verificationCode.length !== 6}
                      >
                        {enableMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enabling...</>
                        ) : (
                          'Enable 2FA'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setSetupData(null); setVerificationCode(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Disable 2FA Section */}
          {is2FAEnabled && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-medium text-foreground mb-2">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your current 2FA code to disable two-factor authentication.
              </p>
              <form onSubmit={handleDisable} className="flex gap-2 items-end">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="disableCode">Verification Code</Label>
                  <Input
                    id="disableCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={disableMutation.isPending || disableCode.length !== 6}
                >
                  {disableMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Disabling...</>
                  ) : (
                    'Disable 2FA'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
    </div>
  );
}

