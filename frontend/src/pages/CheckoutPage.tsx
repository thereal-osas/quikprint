import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { Truck, Shield } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useCreateOrder, useShippingConfig } from '@/hooks/useApi';
import { paymentsApi, ApiError, getAuthToken } from '@/services/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, discountAmount } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrder = useCreateOrder();

  const { data: shippingConfig } = useShippingConfig();

  const shippingFee = shippingConfig?.shippingFee ?? 5000;
  const freeShippingThreshold = shippingConfig?.freeShippingThreshold ?? 50000;
  const shipping = subtotal > freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal - discountAmount + shipping;

  // Helper function to initialize Paystack
  const initializePaystack = (
    payment: { reference: string; authorization_url: string },
    paystackKey: string,
    email: string,
    total: number
  ) => {
    try {
      // Validate email is provided
      if (!email || !email.trim()) {
        throw new Error('Email is required for payment');
      }

      console.log('DEBUG: Initializing Paystack with email:', email);
      console.log('DEBUG: Payment reference:', payment.reference);
      console.log('DEBUG: Authorization URL:', payment.authorization_url);
      console.log('DEBUG: Amount in kobo:', Math.round(total * 100));

      // Use authorization_url directly - it's already pre-configured by Paystack
      // This avoids parameter validation issues with the SDK
      if (payment.authorization_url) {
        console.log('DEBUG: Using authorization URL for payment redirect');
        window.location.href = payment.authorization_url;
        return;
      }

      // Fallback to SDK if URL not available
      const paystackHandler = ((window as unknown) as Record<string, unknown>).PaystackPop as {
        setup: (config: Record<string, unknown>) => {
          openIframe: () => void;
        };
      };
      
      if (!paystackHandler) {
        throw new Error('PaystackPop not available and authorization URL not provided');
      }
      
      console.log('DEBUG: Fallback: Using PaystackPop.setup()');
      const handler = paystackHandler.setup({
        key: paystackKey,
        email: email.trim(),
        amount: Math.round(total * 100), // Convert to kobo and ensure it's an integer
        ref: payment.reference,
        currency: 'NGN',
        onClose: () => {
          toast.info('Payment cancelled. You can try again.');
          setIsSubmitting(false);
        },
        callback: (response: { reference: string; trans: string }) => {
          console.log('Payment successful:', response);
          // Redirect to callback page with reference to verify payment
          window.location.href = `/checkout/callback?reference=${response.reference}`;
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error('Paystack initialization error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open payment modal');

      // Fallback: redirect to Paystack URL
      window.location.href = payment.authorization_url;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!getAuthToken()) {
      toast.error('Please log in to place an order.');
      navigate('/login');
      return;
    }

    if (items.length === 0 || subtotal <= 0) {
      toast.error('Your cart is empty.');
      navigate('/cart');
      return;
    }

    // Validate minimum order amount (0.50 NGN = 50 kobo)
    if (total < 0.5) {
      toast.error('Order total must be at least 0.50 NGN');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Validate form fields
      const email = String(formData.get('email') || '').trim();
      const firstName = String(formData.get('firstName') || '').trim();
      const lastName = String(formData.get('lastName') || '').trim();
      
      if (!email) {
        toast.error('Please enter your email address');
        setIsSubmitting(false);
        return;
      }

      if (!email.includes('@')) {
        toast.error('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      const name = `${firstName} ${lastName}`.trim();

      const shippingAddress = {
        name,
        street: String(formData.get('address') || ''),
        city: String(formData.get('city') || ''),
        state: String(formData.get('state') || ''),
        zip: String(formData.get('zip') || ''),
        country: String(formData.get('country') || ''),
      };

      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        configuration: item.configuration,
      }));

      console.log('Creating order with:',  {
        shippingAddress,
        items: orderItems.length,
        discount: discountAmount,
        total,
      });

      // Create order in backend with discount
      const order = await createOrder.mutateAsync({
        shippingAddress,
        items: orderItems,
        discount: discountAmount,
      });

      console.log('Order created:', order.id, 'Total:', order.total);

      // Initialize payment with Paystack
      try {
        console.log('Initializing payment for order:', order.id);
        const payment = await paymentsApi.initialize({
          orderId: order.id,
        });

        console.log('Payment initialized:', {
          reference: payment.reference,
          authUrlLength: payment.authorization_url?.length || 0,
        });

        // Validate payment response
        if (!payment.authorization_url) {
          throw new Error('Payment system returned no authorization URL');
        }
        if (!payment.reference) {
          throw new Error('Payment system returned no reference');
        }
        
        // Get Paystack public key from environment or use fallback
        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key';
        
        // Always use authorization URL - it's the most reliable method
        console.log('Using Paystack authorization URL for payment');
        console.log('Redirecting to Paystack...');
        
        // Validate that we have a proper Paystack key before trying SDK
        if (paystackKey && paystackKey !== 'pk_test_your_paystack_public_key') {
          // Try to load and use Paystack SDK as primary method
          const loadPaystackScript = () => {
            return new Promise<void>((resolve, reject) => {
              if (((window as unknown) as Record<string, unknown>).PaystackPop) {
                resolve();
                return;
              }
              
              const script = document.createElement('script');
              script.src = 'https://js.paystack.co/v1/inline.js';
              script.async = true;
              
              script.onload = () => {
                console.log('Paystack script loaded successfully');
                resolve();
              };
              
              script.onerror = (error) => {
                console.error('Failed to load Paystack script:', error);
                reject(error);
              };
              
              document.head.appendChild(script);
            });
          };

          try {
            await loadPaystackScript();
            initializePaystack(payment, paystackKey, email, total);
          } catch (scriptError) {
            console.error('Paystack SDK failed, using authorization URL:', scriptError);
            // Fallback: redirect to Paystack URL
            window.location.href = payment.authorization_url;
          }
        } else {
          // No valid key, use authorization URL directly
          console.log('No valid Paystack key, using authorization URL directly');
          window.location.href = payment.authorization_url;
        }
        return;
      } catch (paymentError) {
        console.error('Payment initialization error:', paymentError);
        if (paymentError instanceof ApiError) {
          toast.error(`Payment error: ${paymentError.message}`);
        } else if (paymentError instanceof Error) {
          toast.error(`Payment error: ${paymentError.message}`);
        } else {
          toast.error('Failed to initialize payment. Please try again.');
        }

      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      if (error instanceof ApiError) {
        toast.error(`Checkout error: ${error.message}`);
      } else if (error instanceof Error) {
        toast.error(`Checkout error: ${error.message}`);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Layout>
      <div className="container-main section-padding">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="(555) 555-5555" />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Shipping Address
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" name="address" required />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" required />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" required />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" name="zip" required />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" defaultValue="Nigeria" required />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Payment Method
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Choose Your Payment Method
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Select how you'd like to pay for your order. All methods are secure and processed by Paystack.
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Options */}
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        defaultChecked
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Card Payment</div>
                        <div className="text-sm text-muted-foreground">
                          Pay with debit/credit card (Visa, Mastercard, Verve)
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Secure</span>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Bank Transfer</div>
                        <div className="text-sm text-muted-foreground">
                          Pay via bank transfer or mobile banking
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Secure</span>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ussd"
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">USSD Payment</div>
                        <div className="text-sm text-muted-foreground">
                          Pay using USSD code from your bank
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Secure</span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Payment Security</h4>
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>SSL Encrypted</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>PCI Compliant</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>Paystack Secured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[180px]">
                        {item.product.name}
                      </span>
                      <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Coupon discount</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-success">FREE</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="cta"
                  size="xl"
                  className="w-full mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By placing your order, you agree to our Terms & Conditions
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
