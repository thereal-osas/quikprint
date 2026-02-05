import type { CartItem } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { removeItem } = useCart();

  // Format configuration for display
  const configEntries = Object.entries(item.configuration).map(([key, value]) => {
    const option = item.product.options.find((o) => o.id === key);
    if (!option) return null;
    
    let displayValue = String(value);
    if (option.type === 'select' || option.type === 'radio') {
      const selectedOpt = option.options?.find((o) => o.value === value);
      displayValue = selectedOpt?.label || String(value);
    } else if (option.type === 'dimension') {
      displayValue = `${value} ${option.unit}`;
    }
    
    return { name: option.name, value: displayValue };
  }).filter(Boolean);

  return (
    <div className="flex gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Product image */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">{item.product.name}</h3>
            <p className="text-sm text-muted-foreground">{item.product.category}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{formatPrice(item.totalPrice)}</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="mt-3 flex flex-wrap gap-2">
          {configEntries.map((config) => (
            config && (
              <span
                key={config.name}
                className="inline-flex items-center px-2 py-1 rounded bg-muted text-xs text-muted-foreground"
              >
                {config.name}: <span className="font-medium ml-1 text-foreground">{config.value}</span>
              </span>
            )
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
