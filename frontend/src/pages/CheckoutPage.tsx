import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { CreditCard, Truck, Shield } from 'lucide-react';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/currency';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : 5000;
  const tax = subtotal * 0.075; // 7.5% VAT for Nigeria
  const total = subtotal + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    clearCart();
    toast.success('Order placed successfully!');
    navigate('/order-success');
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
                    <Input id="email" type="email" required placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" required placeholder="(555) 555-5555" />
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
                    <Input id="firstName" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" required />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" required />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" required />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" defaultValue="United States" required />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Payment Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input id="cardName" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="•••• •••• •••• ••••" required />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiration Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="•••" required />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. VAT (7.5%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
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
