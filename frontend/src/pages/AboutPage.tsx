import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Palette,
  Package,
  Gift,
  Heart,
  Building2,
  Clock,
  Shield,
  Truck,
  Award,
  Users,
  Target,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';

const stats = [
  { value: '10,000+', label: 'Projects Delivered', icon: Target },
  { value: '5,000+', label: 'Happy Customers', icon: Users },
  { value: '10+', label: 'Years Experience', icon: Award },
  { value: '99%', label: 'On-Time Delivery', icon: Clock },
];

const services = [
  {
    icon: Printer,
    title: 'Commercial Printing',
    description: 'Business cards, flyers, brochures, catalogs, and professional marketing materials.',
  },
  {
    icon: Building2,
    title: 'Large Format Printing',
    description: 'Banners, roll-up stands, backdrops, billboards, and eye-catching signage.',
  },
  {
    icon: Palette,
    title: 'Branding Solutions',
    description: 'Complete brand identity packages, logos, and promotional items.',
  },
  {
    icon: Package,
    title: 'Custom Packaging',
    description: 'Product boxes, labels, and branded packaging solutions for your products.',
  },
  {
    icon: Heart,
    title: 'Wedding Stationery',
    description: 'Invitation cards, programs, and coordinated event materials.',
  },
  {
    icon: Gift,
    title: 'Corporate Gifts',
    description: 'Branded promotional items for events, marketing, and client appreciation.',
  },
];

const whyChooseUs = [
  {
    icon: Printer,
    title: 'State-of-the-Art Equipment',
    description: 'Digital and offset printing on the latest machinery for exceptional quality.',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    description: 'Same-day printing available. We understand deadlines matter.',
  },
  {
    icon: Shield,
    title: 'Quality Guarantee',
    description: 'We stand behind every print. 100% satisfaction guaranteed.',
  },
  {
    icon: Truck,
    title: 'Nationwide Delivery',
    description: 'Free delivery in Lagos on orders over ₦50,000. We deliver across Nigeria.',
  },
];

export default function AboutPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="relative container-main py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-6">
              Nigeria's Trusted
              <br />
              <span className="text-accent">Printing Partner</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              We bring your ideas to life with quality printing, creative design, and exceptional service.
              From business cards to billboards, we deliver excellence every time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button variant="hero" size="xl">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="xl"
                  className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Get a Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-card border-b border-border">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="section-padding bg-background">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Our Story</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-6 rounded-full" />
            <p className="text-muted-foreground mb-4">
              QuikPrint Nigeria is a leading printing and branding company based in Lagos, Nigeria.
              We specialize in providing high-quality printing solutions for businesses of all sizes,
              from ambitious startups to established corporations.
            </p>
            <p className="text-muted-foreground">
              Our mission is simple: to help Nigerian businesses and individuals create powerful visual
              impressions through quality printing and innovative design. We combine state-of-the-art
              technology with creative expertise to deliver results that exceed expectations.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">What We Offer</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive printing and branding solutions for every need
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-card p-6 rounded-lg border border-border hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-background">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Why Choose QuikPrint?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your one-stop shop for all printing and branding needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="bg-accent py-12 sm:py-16">
        <div className="container-main">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-accent-foreground mb-2">
                Ready to Start Your Project?
              </h2>
              <p className="text-accent-foreground/90 max-w-xl">
                Get in touch with us today for a free consultation and quote.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 text-accent-foreground">
                <div className="w-10 h-10 rounded-full bg-accent-foreground/10 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-accent-foreground/70">Call us</p>
                  <a href="tel:+2348160360655" className="font-semibold hover:underline">
                    +234 816 036 0655
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 text-accent-foreground">
                <div className="w-10 h-10 rounded-full bg-accent-foreground/10 flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-accent-foreground/70">Email us</p>
                  <a href="mailto:hello@quikprint.ng" className="font-semibold hover:underline">
                    hello@quikprint.ng
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mt-8 pt-8 border-t border-accent-foreground/20 flex flex-col sm:flex-row items-center justify-center gap-6 text-accent-foreground/90">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Lagos, Nigeria</span>
            </div>
            <Link to="/contact">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
