import { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { paymentsApi, ApiError, getAuthToken } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useApi';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Package } from 'lucide-react';

type PaymentStatus = 'idle' | 'verifying' | 'success' | 'failed';

export default function PaymentCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [reference, setReference] = useState<string | null>(null);
  const verifyOnceRef = useRef(false);

  // Extract ?reference from Paystack callback URL
  useEffect(() => {
    // Only verify once per page load
    if (verifyOnceRef.current) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('reference') || searchParams.get('trxref');

    if (!ref) {
      setStatus('failed');
      setMessage('Missing payment reference. Please contact support if you were charged.');
      verifyOnceRef.current = true;
      return;
    }

    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
      setStatus('failed');
      setMessage('Please log in to verify payment.');
      verifyOnceRef.current = true;
      return;
    }

    setReference(ref);
    setStatus('verifying');
    verifyOnceRef.current = true;

    const verifyPayment = async () => {
      try {
        console.log('Verifying payment with reference:', ref);
        const result = await paymentsApi.verify(ref);
        console.log('Payment verification result:', result);
        
        if (result && result.status === 'success') {
          console.log('Payment successful, updating UI');
          setStatus('success');
          setMessage('Your payment was successful and your order has been marked as paid.');
          // Clear cart
          clearCart();
          // Invalidate queries to refresh order status - do this after a short delay
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders });
            queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders });
          }, 1000);
        } else {
          console.log('Payment not successful, status:', result?.status);
          setStatus('failed');
          setMessage(`Payment verification returned: ${result?.status || 'unknown'}. If you were charged, please contact support.`);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        if (error instanceof ApiError) {
          setMessage(`Error: ${error.message}`);
        } else if (error instanceof Error) {
          setMessage(`Error: ${error.message}`);
        } else {
          setMessage('Unable to verify payment. Please try again or contact support.');
        }
      }
    };

    verifyPayment();
  }, []);

  const handleGoToOrders = () => {
    navigate('/account/orders');
  };

  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-2xl mx-auto text-center">
          {status === 'verifying' && (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Verifying your payment...
              </h1>
              <p className="text-muted-foreground">
                Please wait a moment while we confirm your transaction with Paystack.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Payment Successful
              </h1>
              <p className="text-muted-foreground mb-4">
                {message}
              </p>
              {reference && (
                <p className="text-xs text-muted-foreground mb-6">
                  Payment reference: <span className="font-mono">{reference}</span>
                </p>
              )}

              <div className="bg-muted rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-foreground mb-4">Next steps</h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      Your order status is now updated. You can track it from your account dashboard.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" onClick={handleGoToOrders}>
                  View My Orders
                </Button>
                <Link to="/products">
                  <Button variant="outline" size="lg">
                    Continue Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Payment Could Not Be Verified
              </h1>
              <p className="text-muted-foreground mb-4">
                {message}
              </p>
              {reference && (
                <p className="text-xs text-muted-foreground mb-6">
                  Payment reference: <span className="font-mono">{reference}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" onClick={handleGoToOrders}>
                  View My Orders
                </Button>
                <Link to="/checkout">
                  <Button variant="outline" size="lg">
                    Try Again
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

