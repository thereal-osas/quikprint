import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { ValueProps } from '@/components/home/ValueProps';
import { CTABanner } from '@/components/home/CTABanner';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoryGrid />
      <FeaturedProducts />
      <ValueProps />
      <CTABanner />
    </Layout>
  );
};

export default Index;
