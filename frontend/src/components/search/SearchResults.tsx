import { Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/currency';

interface SearchResultsProps {
  results: Product[];
  isLoading?: boolean;
  query: string;
  onResultClick: () => void;
}

export function SearchResults({ results, isLoading, query, onResultClick }: SearchResultsProps) {
  if (!query.trim()) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center text-muted-foreground">
          Searching...
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          No products found for "{query}"
        </div>
      ) : (
        <div className="py-2">
          <p className="px-4 py-1 text-xs text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          {results.slice(0, 5).map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              onClick={onResultClick}
              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-10 h-10 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.category}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">
                {formatPrice(product.basePrice)}
              </span>
            </Link>
          ))}
          {results.length > 5 && (
            <Link
              to={`/products?search=${encodeURIComponent(query)}`}
              onClick={onResultClick}
              className="block px-4 py-2 text-sm text-center text-primary hover:bg-muted transition-colors border-t border-border"
            >
              View all {results.length} results
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

