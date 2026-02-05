import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { FaTiktok } from "react-icons/fa6";

export function Footer() {
  const productLinks = [
    { name: 'Business Cards', href: '/products/business-cards' },
    { name: 'Flyers & Brochures', href: '/products/flyers-brochures' },
    { name: 'Banners & Signs', href: '/products/banners-signs' },
    { name: 'Postcards', href: '/products/postcards-mailers' },
    { name: 'Stickers & Labels', href: '/products/stickers-labels' },
  ];

  const supportLinks = [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'File Guidelines', href: '/file-guidelines' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <span className="text-xl font-bold">Q</span>
              </div>
              <div>
                <span className="text-xl font-bold">Quik Print</span>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Professional printing services with fast turnaround and exceptional quality. 
              Trusted by businesses since 2010.
            </p>
            <div className="space-y-2 text-sm">
              <a href="tel:1-800-555-0123" className="flex items-center gap-2 hover:text-primary-foreground/80">
                <Phone className="h-4 w-4" />
                1-800-555-0123
              </a>
              <a href="mailto:support@quikprint.com" className="flex items-center gap-2 hover:text-primary-foreground/80">
                <Mail className="h-4 w-4" />
                support@quikprint.com
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>123 Print Street, New York, NY 10001</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Quik Print. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com/quikprint"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@quikprint.ng?_r=1&_t=ZS-93ZGrkcJSYU"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="TikTok"
            >
              <FaTiktok className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/quikprint.ng?igsh=MWYxc2YxbXo1Zm9rZw=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
