import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { ValueProps } from '@/components/home/ValueProps';
import { CTABanner } from '@/components/home/CTABanner';

const Index = () => {
  return (
    <Layout>
      <HeroCarousel />
      <CategoryGrid />
      <FeaturedProducts />
      <ValueProps />
      <CTABanner />
    </Layout>
  );
};

export default Index;
