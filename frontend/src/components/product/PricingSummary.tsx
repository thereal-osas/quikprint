import { Button } from '@/components/ui/button';
import { ShoppingCart, Clock, Shield } from 'lucide-react';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/currency';

interface PricingSummaryProps {
  basePrice: number;
  totalPrice: number;
  quantity?: number;
  turnaround: string;
  onAddToCart: () => void;
  isConfigComplete?: boolean;
}

export function PricingSummary({
//   basePrice,
  totalPrice,
  quantity = 1,
  turnaround,
  onAddToCart,
  isConfigComplete = true,
}: PricingSummaryProps) {
  const unitPrice = totalPrice / quantity;

  return (
    <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
      <div className="space-y-4">
        {/* Price display */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
          {quantity > 1 && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(unitPrice)} per unit × {quantity} units
            </p>
          )}
        </div>

        {/* Turnaround */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Estimated: {turnaround}</span>
        </div>

        {/* CTA Button */}
        <Button
          variant="cta"
          size="xl"
          className="w-full"
          onClick={onAddToCart}
          disabled={!isConfigComplete}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>

        {/* Trust indicators */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-success" />
            <span>100% Satisfaction Guarantee</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}. Expedited shipping available.
          </p>
        </div>
      </div>
    </div>
  );
}
