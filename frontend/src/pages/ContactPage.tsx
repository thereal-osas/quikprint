import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Contact Us
            </h1>
            <p className="text-muted-foreground">
              Have a question or need help with your order? We're here to assist you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Send us a Message
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" required />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={5} required />
                </div>
                <Button type="submit" variant="cta" size="lg">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact info */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Get in Touch
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href="tel:1-800-555-0123" className="text-muted-foreground hover:text-primary">
                        1-800-555-0123
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href="mailto:support@quikprint.com" className="text-muted-foreground hover:text-primary">
                        support@quikprint.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">
                        123 Print Street<br />
                        New York, NY 10001
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-muted-foreground">
                        Mon - Fri: 8am - 6pm EST<br />
                        Sat: 9am - 3pm EST
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Need Urgent Help?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For time-sensitive orders or urgent issues, please call our priority line.
                </p>
                <Button variant="default">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Priority Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
