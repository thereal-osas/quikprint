import { Link } from 'react-router-dom';
import { categories } from '@/data/mockData';
import { ArrowRight } from 'lucide-react';

export function CategoryGrid() {
  return (
    <section className="section-padding bg-background">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse our wide selection of professional printing products
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products/${category.slug}`}
              className="group card-elevated p-4 sm:p-6 hover:border-primary/30 transition-all"
            >
              <div className="aspect-square mb-4 rounded-lg bg-muted overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {category.description}
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Shop Now
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
