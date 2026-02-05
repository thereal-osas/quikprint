import { Layout } from '@/components/layout/Layout';
import { CheckCircle, MapPin, Phone, Mail } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { value: '10,000+', label: 'Projects Delivered' },
    { value: '5,000+', label: 'Happy Customers' },
    { value: '10+', label: 'Years Experience' },
    { value: '99%', label: 'On-Time Delivery' },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="gradient-primary py-16 sm:py-20">
        <div className="container-main text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground mb-4">
            About QuikPrint Nigeria
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Nigeria's trusted printing and branding partner. We bring your ideas to life with
            quality printing, creative design, and exceptional service.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-main">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                QuikPrint Nigeria is a leading printing and branding company based in Lagos, Nigeria.
                We specialize in providing high-quality printing solutions for businesses of all sizes,
                from startups to large corporations.
              </p>
              <p className="text-muted-foreground">
                Our mission is simple: to help Nigerian businesses and individuals create powerful visual
                impressions through quality printing and innovative design. Whether you need business cards,
                brochures, banners, or complete branding packages, we deliver excellence every time.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">What We Offer</h2>
              <ul className="space-y-3">
                {[
                  'Commercial printing: Business cards, flyers, brochures, catalogs, and more',
                  'Large format printing: Banners, roll-up stands, backdrops, and signage',
                  'Branding solutions: Complete brand identity packages and promotional items',
                  'Custom packaging: Product boxes, labels, and branded packaging solutions',
                  'Wedding stationery: Invitation cards, programs, and coordinated event materials',
                  'Corporate gifts: Branded promotional items for events and marketing',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Why Choose QuikPrint?</h2>
              <ul className="space-y-3">
                {[
                  'State-of-the-art digital and offset printing equipment',
                  'Fast turnaround times — same-day printing available',
                  'Competitive pricing without compromising quality',
                  'Free delivery within Lagos on orders over ₦50,000',
                  'Nationwide delivery across Nigeria',
                  'Dedicated customer support team',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-muted rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Contact Us</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Lagos, Nigeria</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <a href="tel:+2347000784547" className="text-muted-foreground hover:text-primary">
                    +234 700 078 4547 (0700-QUIKPRINT)
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                  <a href="mailto:hello@quikprint.ng" className="text-muted-foreground hover:text-primary">
                    hello@quikprint.ng
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
