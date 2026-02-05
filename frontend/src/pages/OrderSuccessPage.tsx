import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

// Generate order number outside component to avoid purity issues
function generateOrderNumber(): string {
  return `QP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function OrderSuccessPage() {
  const [orderNumber] = useState(generateOrderNumber);

  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Thank You for Your Order!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your order has been placed successfully. We'll send you a confirmation email shortly.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Order Number</span>
            </div>
            <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          </div>

          <div className="bg-muted rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-foreground mb-4">What's Next?</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  You'll receive an order confirmation email with your order details and upload instructions.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Once we receive your files, our team will review them and start production.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Track your order status anytime from your account dashboard.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/account/orders">
              <Button variant="default" size="lg">
                View Order Details
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" size="lg">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
