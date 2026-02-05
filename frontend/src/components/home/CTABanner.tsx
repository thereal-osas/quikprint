import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone } from 'lucide-react';

export function CTABanner() {
  return (
    <section className="bg-accent py-12 sm:py-16">
      <div className="container-main">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-accent-foreground mb-2">
              Ready to Bring Your Ideas to Life?
            </h2>
            <p className="text-accent-foreground/90">
              Get a custom quote for your project. Our team is ready to help with design and printing.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/products">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                Shop Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:+2347000784547">
              <Button
                size="lg"
                variant="outline"
                className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10 bg-transparent"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Us Now
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
