import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductConfigurator } from '@/components/product/ProductConfigurator';
import { products } from '@/data/mockData';
import { ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/currency';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return (
      <Layout>
        <div className="container-main section-padding text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Link to="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="container-main py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/products" className="text-muted-foreground hover:text-foreground">
              Products
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              to={`/products/${product.categorySlug}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container-main section-padding">
        {/* Product header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Product image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product info */}
          <div>
            <Badge variant="secondary" className="mb-3">
              {product.category}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {product.name}
            </h1>
            <p className="text-muted-foreground mb-6">{product.description}</p>

            {/* Features */}
            <div className="space-y-2 mb-6">
              <h3 className="font-medium text-foreground">Features:</h3>
              <ul className="space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Starting at:</span>
                <span className="font-bold text-primary text-lg">
                  {formatPrice(product.basePrice)}
                </span>
              </div>
             
            </div>
          </div>
        </div>

        {/* Configurator section */}
        <div className="border-t border-border pt-10">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Configure Your Order
          </h2>
          <ProductConfigurator product={product} />
        </div>
      </div>
    </Layout>
  );
}
