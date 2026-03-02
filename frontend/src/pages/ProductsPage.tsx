import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/product/ProductCard';
import { useProducts, useCategories } from '@/hooks/useApi';
import { ChevronRight, Loader2 } from 'lucide-react';
import type { Product } from '@/types/product';
import type { ProductResponse, CategoryResponse } from '@/services/api';
import { getImageUrls } from '@/lib/utils';

// Helper to map API response to Product type
function mapProductResponse(p: ProductResponse): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category || '',
    categorySlug: p.categorySlug || '',
    description: p.description || '',
    shortDescription: p.shortDescription || p.description?.substring(0, 100) + '...' || '',
    basePrice: p.basePrice,
    images: getImageUrls(p.images),
    options: [],
    features: p.features || [],
    turnaround: p.turnaround || '3-5 business days',
    minQuantity: p.minQuantity || 1,
  };
}

// Helper to map category response
function mapCategoryResponse(c: CategoryResponse) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: c.image || '/placeholder.svg',
    productCount: c.productCount || 0,
  };
}

export default function ProductsPage() {
  const { category } = useParams();

  // Fetch products from API (with optional category filter)
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts(
    category ? { category } : undefined
  );

  // Fetch categories for the filter buttons
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Map API responses to frontend types
  const products = productsData?.map(mapProductResponse) || [];
  const categories = categoriesData?.map(mapCategoryResponse) || [];

  const currentCategory = category
    ? categories.find((c) => c.slug === category)
    : null;

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
            {categoriesLoading ? (
              <span className="px-4 py-2 text-sm text-muted-foreground">Loading categories...</span>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products/${cat.slug}`}
                  className="px-4 py-2 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary text-sm font-medium transition-colors"
                >
                  {cat.name}
                </Link>
              ))
            )}
          </div>
        )}

        {/* Loading state */}
        {productsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading products...</span>
          </div>
        )}

        {/* Error state */}
        {productsError && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Failed to load products. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Refresh page
            </button>
          </div>
        )}

        {/* Product grid */}
        {!productsLoading && !productsError && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!productsLoading && !productsError && products.length === 0 && (
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
