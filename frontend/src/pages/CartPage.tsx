import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useApplyCoupon, useShippingConfig } from '@/hooks/useApi';
import { toast } from 'sonner';
import { ApiError } from '@/services/api';

export default function CartPage() {
  const { items, subtotal, clearCart, discountAmount, applyCoupon, clearCoupon } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const applyCouponMutation = useApplyCoupon();

  const { data: shippingConfig } = useShippingConfig();

  const shippingFee = shippingConfig?.shippingFee ?? 5000;
  const freeShippingThreshold = shippingConfig?.freeShippingThreshold ?? 50000;
  const shipping = subtotal > freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal - discountAmount + shipping;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || subtotal <= 0) return;

    try {
      const result = await applyCouponMutation.mutateAsync({
        code: couponCode.trim(),
        orderAmount: subtotal,
      });
      applyCoupon(couponCode.trim(), result.discountAmount, result.message);
      setCouponMessage(result.message);
      toast.success(result.message || 'Coupon applied successfully');
    } catch (error) {
      clearCoupon();
      setCouponMessage(null);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to apply coupon');
      }
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-main section-padding text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link to="/products">
              <Button variant="cta" size="lg">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main section-padding">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
          Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}

            <div className="flex justify-between pt-4">
              <Link to="/products">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
              <Button variant="ghost" onClick={clearCart} className="text-destructive hover:text-destructive">
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Order Summary
              </h2>

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

              {/* Coupon code */}
              <form onSubmit={handleApplyCoupon} className="mt-4 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="coupon">
                  Coupon code
                </label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-10"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={applyCouponMutation.isPending || !couponCode.trim()}
                  >
                    {applyCouponMutation.isPending ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                {discountAmount > 0 && couponMessage && (
                  <p className="text-xs text-success">{couponMessage}</p>
                )}
              </form>

              {subtotal < freeShippingThreshold && (
                <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
                  Add {formatPrice(freeShippingThreshold - subtotal)} more for free shipping!
                </p>
              )}

              <Link to="/checkout" className="block mt-6">
                <Button variant="cta" size="xl" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure checkout. Your information is protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
