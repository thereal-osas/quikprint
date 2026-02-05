import { Layout } from '@/components/layout/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            Privacy Policy
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: January 2024
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly, including name, email, shipping 
              address, payment information, and files uploaded for printing. We also collect 
              usage data such as IP address and browser type.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to process orders, communicate about your orders, 
              improve our services, and send promotional communications (with your consent).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We share information only with 
              service providers necessary to fulfill your orders (payment processors, 
              shipping carriers) and as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your information. 
              All payment transactions are encrypted using SSL technology.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2>
            <p className="text-muted-foreground">
              You may access, update, or delete your personal information by logging into 
              your account or contacting us. You may opt out of marketing communications 
              at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies to enhance your browsing experience and analyze site traffic. 
              You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, contact us at privacy@quikprint.com or 
              call 1-800-555-0123.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
