import { Palette, Printer, Package, Users } from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Design',
    description: 'Great design drives everything we do. Our creative team brings your vision to life with stunning visuals.',
  },
  {
    icon: Printer,
    title: 'Print',
    description: 'We offer commercial and large format printing on state-of-the-art digital and offset printing machines.',
  },
  {
    icon: Package,
    title: 'Brand',
    description: 'From packaging to promotional items, we help create cohesive brand experiences that stand out.',
  },
  {
    icon: Users,
    title: 'Dedicated Support',
    description: 'Our experienced team provides personalized service from concept to delivery, ensuring your satisfaction.',
  },
];

export function ValueProps() {
  return (
    <section className="section-padding bg-background">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Why Choose QuikPrint Nigeria?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your one-stop shop for all printing and branding needs. We deliver quality, speed, and value.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
