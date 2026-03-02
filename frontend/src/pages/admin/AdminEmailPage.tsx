import { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle2, Users, User } from 'lucide-react';
import { useEmailStatus, useSendTestEmail, useSendBroadcast } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminEmailPage() {
  const { data: statusData, isLoading: statusLoading } = useEmailStatus();
  const sendTestEmail = useSendTestEmail();
  const sendBroadcast = useSendBroadcast();

  const [testEmail, setTestEmail] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const [specificEmails, setSpecificEmails] = useState('');

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    message: string;
    successCount?: number;
    failedCount?: number;
  } | null>(null);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    try {
      const result = await sendTestEmail.mutateAsync({ email: testEmail });
      setTestResult({ success: true, message: result.message });
      setTestEmail('');
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Failed to send test email' });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastResult(null);
    
    const recipients = recipientType === 'specific' 
      ? specificEmails.split(',').map(email => email.trim()).filter(Boolean)
      : undefined;

    try {
      const result = await sendBroadcast.mutateAsync({
        subject: broadcastSubject,
        content: broadcastContent,
        sendToAll: recipientType === 'all',
        recipients,
      });
      setBroadcastResult({
        success: true,
        message: result.message,
        successCount: result.successCount,
        failedCount: result.failedCount,
      });
      setBroadcastSubject('');
      setBroadcastContent('');
      setSpecificEmails('');
    } catch (error) {
      setBroadcastResult({ success: false, message: error instanceof Error ? error.message : 'Failed to send broadcast' });
    }
  };

  const isConfigured = statusData?.configured ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">Send test emails and broadcast messages to customers</p>
      </div>

      {/* Email Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <p className="text-muted-foreground">Checking email configuration...</p>
          ) : isConfigured ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>Email service is configured and ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Email service is not configured. Please set SMTP environment variables.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Email Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>Send a test email to verify SMTP configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                required
                disabled={!isConfigured}
              />
            </div>
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{testResult.message}</span>
              </div>
            )}
            <Button type="submit" disabled={!isConfigured || sendTestEmail.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendTestEmail.isPending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Broadcast Email Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Broadcast Email</CardTitle>
          <CardDescription>Send an email to all customers or specific recipients</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Email subject"
                required
                disabled={!isConfigured}
              />
            </div>

            <div>
              <Label htmlFor="content">Content (HTML supported)</Label>
              <Textarea
                id="content"
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                placeholder="Enter your email content here. HTML tags are supported."
                rows={6}
                required
                disabled={!isConfigured}
              />
            </div>

            <div>
              <Label className="mb-3 block">Recipients</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === 'all'}
                    onChange={() => setRecipientType('all')}
                    disabled={!isConfigured}
                    className="w-4 h-4"
                  />
                  <Users className="h-4 w-4" />
                  <span>All Customers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === 'specific'}
                    onChange={() => setRecipientType('specific')}
                    disabled={!isConfigured}
                    className="w-4 h-4"
                  />
                  <User className="h-4 w-4" />
                  <span>Specific Emails</span>
                </label>
              </div>
            </div>

            {recipientType === 'specific' && (
              <div>
                <Label htmlFor="recipients">Email Addresses (comma-separated)</Label>
                <Input
                  id="recipients"
                  value={specificEmails}
                  onChange={(e) => setSpecificEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  disabled={!isConfigured}
                />
              </div>
            )}

            {broadcastResult && (
              <div className={`p-4 rounded-md ${broadcastResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {broadcastResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span className="font-medium">{broadcastResult.message}</span>
                </div>
                {broadcastResult.successCount !== undefined && (
                  <div className="text-sm">
                    <p>Successfully sent: {broadcastResult.successCount}</p>
                    <p>Failed: {broadcastResult.failedCount}</p>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={!isConfigured || sendBroadcast.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendBroadcast.isPending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
