import { Layout } from '@/components/layout/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            Terms & Conditions
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: January 2024
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Quik Print's services, you accept and agree to be bound by 
              these Terms and Conditions. If you do not agree to these terms, please do not use 
              our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Orders and Pricing</h2>
            <p className="text-muted-foreground">
              All orders are subject to acceptance and availability. Prices are subject to change 
              without notice. We reserve the right to refuse or cancel any order for any reason.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. File Requirements</h2>
            <p className="text-muted-foreground">
              Customers are responsible for ensuring that uploaded files meet our specifications. 
              We are not responsible for print quality issues resulting from low-resolution images 
              or improper file setup.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              Customers represent that they have the right to reproduce all content submitted 
              for printing. We are not liable for copyright or trademark infringement claims.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Shipping and Delivery</h2>
            <p className="text-muted-foreground">
              Delivery times are estimates only and not guaranteed. We are not responsible for 
              delays caused by carriers or circumstances beyond our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Returns and Refunds</h2>
            <p className="text-muted-foreground">
              We offer reprints or refunds only for orders with proven quality defects or errors 
              on our part. Claims must be submitted within 7 days of delivery.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Our liability is limited to the cost of the order. We are not liable for any 
              indirect, incidental, or consequential damages.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
