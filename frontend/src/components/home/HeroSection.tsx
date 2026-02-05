import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, Clock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-primary opacity-95" />

      {/* Content */}
      <div className="relative container-main py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-6">
            Design. Print. Brand.
            <br />
            <span className="text-accent">We Bring Your Ideas to Life</span>
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-xl">
            Nigeria's trusted printing partner. From business cards to banners, branding to packaging —
            we deliver high-quality, cost-effective printing solutions that help your brand stand out.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link to="/products">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Shop All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="xl" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Get a Quote
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Free Delivery</p>
                <p className="text-xs text-primary-foreground/70">Orders over ₦50,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Fast Turnaround</p>
                <p className="text-xs text-primary-foreground/70">As quick as same day</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Quality Guarantee</p>
                <p className="text-xs text-primary-foreground/70">100% satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
