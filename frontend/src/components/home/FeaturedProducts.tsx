import { Link } from 'react-router-dom';
import { products } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/currency';

export function FeaturedProducts() {
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="section-padding bg-secondary/50">
      <div className="container-main">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Popular Products
            </h2>
            <p className="text-muted-foreground">
              Our most ordered items with fast turnaround
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
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
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.basePrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">starting</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
