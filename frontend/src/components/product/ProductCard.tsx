import { Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group card-elevated overflow-hidden"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <Badge variant="secondary" className="mb-2">
          {product.category}
        </Badge>
        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.shortDescription}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.basePrice)}
            </span>
            <span className="text-sm text-muted-foreground">starting</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {product.turnaround}
          </span>
        </div>
      </div>
    </Link>
  );
}
