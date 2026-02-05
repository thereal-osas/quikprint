import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/currency';

export default function CartPage() {
  const { items, subtotal, clearCart } = useCart();

  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : 5000;
  const tax = subtotal * 0.075; // 7.5% VAT for Nigeria
  const total = subtotal + shipping + tax;

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

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
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
