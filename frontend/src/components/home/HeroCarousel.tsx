import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Truck, Shield, Clock, Loader2 } from 'lucide-react';
import { useHeroSlides } from '@/hooks/useApi';
import { getImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HeroCarouselProps {
  autoRotateInterval?: number;
}

export function HeroCarousel({ autoRotateInterval = 5000 }: HeroCarouselProps) {
  const { data: slides, isLoading } = useHeroSlides();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlides = slides || [];
  const hasMultiple = activeSlides.length > 1;

  const goToNext = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const goToPrevious = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Auto-rotate slides
  useEffect(() => {
    if (!hasMultiple || isPaused) return;
    const timer = setInterval(goToNext, autoRotateInterval);
    return () => clearInterval(timer);
  }, [hasMultiple, isPaused, goToNext, autoRotateInterval]);

  // Reset index if slides change
  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  // Show loading state
  if (isLoading) {
    return (
      <section className="relative overflow-hidden gradient-primary min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </section>
    );
  }

  // Fallback to static hero if no slides
  if (activeSlides.length === 0) {
    return <StaticHero />;
  }

  const currentSlide = activeSlides[currentIndex];
  if (!currentSlide) return <StaticHero />;

  return (
    <section 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={getImageUrl(currentSlide.imageUrl)}
          alt={currentSlide.heading}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative container-main py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {currentSlide.heading}
          </h1>
          {currentSlide.subheading && (
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl">
              {currentSlide.subheading}
            </p>
          )}

          {currentSlide.ctaText && currentSlide.ctaLink && (
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to={currentSlide.ctaLink}>
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  {currentSlide.ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Trust badges */}
          <TrustBadges />
        </div>
      </div>

      {/* Navigation Arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                idx === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Trust badges component
function TrustBadges() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex items-center gap-3 text-white/90">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">Free Delivery</p>
          <p className="text-xs text-white/70">Orders over ₦50,000</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-white/90">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">Fast Turnaround</p>
          <p className="text-xs text-white/70">As quick as same day</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-white/90">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">Quality Guarantee</p>
          <p className="text-xs text-white/70">100% satisfaction</p>
        </div>
      </div>
    </div>
  );
}

// Static fallback hero (when no slides in database)
function StaticHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-95" />
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
          <TrustBadges />
        </div>
      </div>
    </section>
  );
}

