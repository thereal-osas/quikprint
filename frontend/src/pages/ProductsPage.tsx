import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/product/ProductCard';
import { products, categories } from '@/data/mockData';
import { ChevronRight } from 'lucide-react';

export default function ProductsPage() {
  const { category } = useParams();
  
  const currentCategory = category 
    ? categories.find((c) => c.slug === category) 
    : null;

  const filteredProducts = category
    ? products.filter((p) => p.categorySlug === category)
    : products;

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
            {currentCategory && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{currentCategory.name}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container-main section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {currentCategory ? currentCategory.name : 'All Products'}
          </h1>
          <p className="text-muted-foreground">
            {currentCategory 
              ? currentCategory.description 
              : 'Browse our complete catalog of professional printing products'
            }
          </p>
        </div>

        {/* Categories filter (if showing all) */}
        {!category && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              to="/products"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products/${cat.slug}`}
                className="px-4 py-2 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary text-sm font-medium transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category.</p>
            <Link to="/products" className="text-primary hover:underline mt-2 inline-block">
              View all products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
