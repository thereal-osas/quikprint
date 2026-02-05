import { Layout } from '@/components/layout/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What file formats do you accept for printing?',
    answer: 'We accept PDF, AI, PSD, CDR, EPS, and high-resolution JPG/PNG files. For best results, we recommend PDF files with fonts outlined and images at 300 DPI resolution. If you need help with file preparation, our design team can assist you.',
  },
  {
    question: 'What are your turnaround times?',
    answer: 'Turnaround times vary by product. Business cards typically take 2-3 business days, while brochures and flyers take 3-5 business days. Large format items like banners may take 3-7 days depending on size and quantity. We also offer same-day and rush printing for urgent orders at an additional cost.',
  },
  {
    question: 'Do you offer design services?',
    answer: 'Yes! Our experienced in-house design team can help create stunning designs for all your printing needs. Whether you need a logo, business card design, brochure layout, or complete brand identity, we\'ve got you covered. Design services are quoted based on project complexity.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, card payments (Visa, Mastercard), and mobile money payments. For corporate clients, we also offer invoice-based payment terms. All online payments are processed securely through Paystack.',
  },
  {
    question: 'Do you deliver nationwide?',
    answer: 'Yes, we deliver across Nigeria! Orders over ₦50,000 enjoy free delivery within Lagos. For deliveries outside Lagos, shipping fees are calculated based on location and order weight. We partner with reliable logistics companies to ensure your orders arrive safely.',
  },
  {
    question: 'Can I pick up my order from your office?',
    answer: 'Yes, pickup is available at our Lagos office. Simply select "Pickup" at checkout and we\'ll notify you via SMS and email when your order is ready for collection. Please bring your order confirmation when picking up.',
  },
  {
    question: 'What paper stocks and finishes are available?',
    answer: 'We offer a wide range of paper stocks including art paper (115gsm - 300gsm), cardstock (250gsm - 400gsm), textured papers, and specialty stocks. Finish options include matte lamination, gloss lamination, soft-touch lamination, spot UV, and foil stamping.',
  },
  {
    question: 'Do you offer bulk discounts?',
    answer: 'Yes, we offer competitive pricing on bulk orders. Volume discounts are automatically applied when you select higher quantities. For very large orders or ongoing printing needs, contact our sales team at hello@quikprint.ng for custom quotes.',
  },
  {
    question: 'What is your quality guarantee?',
    answer: 'We stand behind our work with a 100% satisfaction guarantee. If there\'s any issue with print quality or an error on our part, we\'ll reprint your order at no additional cost. Please report any issues within 48 hours of receiving your order.',
  },
  {
    question: 'Can I see a proof before printing?',
    answer: 'Yes! We provide digital proofs for all orders before printing. You\'ll receive an email with your proof for approval. For large or complex orders, we also offer physical samples at an additional cost.',
  },
];

export default function FAQPage() {
  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about our printing services.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-6 bg-muted rounded-lg">
            <h2 className="font-semibold text-foreground mb-2">
              Still have questions?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is here to help.
            </p>
            <a href="/contact" className="text-primary hover:underline font-medium">
              Contact Us →
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
