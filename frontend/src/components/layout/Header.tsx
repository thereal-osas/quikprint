import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Phone, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchResults } from '@/components/search/SearchResults';
import { useUser, useProducts, useCategories } from '@/hooks/useApi';
import { getAuthToken } from '@/services/api';
import { getImageUrls } from '@/lib/utils';
import type { Product } from '@/types/product';
import { AnnouncementBanner } from './AnnouncementBanner';
import { MainNavigation } from './MainNavigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Mobile Products Menu with Accordion
function MobileProductsMenu({ onItemClick }: { onItemClick: () => void }) {
  const { data: categories } = useCategories();

  // Group categories into logical sections based on actual database categories
  const categoryGroups = [
    {
      name: 'Business Essentials',
      slugs: ['business-cards', 'letter-heads', 'branded-envelopes', 'continuation-sheets', 'branded-notepads-jotters', 'folders', 'stationeries'],
    },
    {
      name: 'Marketing Materials',
      slugs: ['flyers-handbills', 'marketing-brochures', 'posters', 'banners-large-format', 'sticker'],
    },
    {
      name: 'Corporate Branding',
      slugs: ['branded-cufflinks', 'branded-nylon-bags', 'branded-paper-bags', 'caps-and-hats', 'custom-tshirts', 'customised-lanyards', 'tote-bags', 'woven-tags'],
    },
    {
      name: 'Events & Celebrations',
      slugs: ['wedding-stationery', 'greeting-cards', 'calendars', 'badges-and-medals'],
    },
    {
      name: 'Office & Professional',
      slugs: ['plastic-id-card', 'corporate-gifts-souvenirs', 'frames-wall-arts'],
    },
    {
      name: 'Custom Printing',
      slugs: ['custom-tshirts'],
    },
    {
      name: 'Packaging & Labels',
      slugs: ['sticker', 'woven-tags', 'branded-paper-bags', 'tote-bags'],
    },
    {
      name: 'Large Format',
      slugs: ['banners-large-format', 'posters', 'frames-wall-arts'],
    },
  ];

  // Get categories that match the slugs in each group
  const getGroupCategories = (slugs: string[]) => {
    if (!categories) return [];
    return categories.filter((cat) => slugs.includes(cat.slug));
  };

  return (
    <div className="space-y-2">
      {categoryGroups.map((group) => {
        const groupCategories = getGroupCategories(group.slugs);
        if (groupCategories.length === 0) return null;
        
        return (
          <Accordion type="single" collapsible className="w-full" key={group.name}>
            <AccordionItem value={group.name} className="border-none">
              <AccordionTrigger className="py-2 px-3 text-sm font-medium text-foreground hover:bg-muted rounded-md hover:no-underline">
                {group.name}
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="flex flex-col gap-1 pl-4">
                  {groupCategories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/products/${category.slug}`}
                      className="py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      onClick={onItemClick}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
      <Link
        to="/products"
        className="py-2 px-3 text-sm font-medium text-primary hover:bg-muted rounded-md transition-colors block"
        onClick={onItemClick}
      >
        Products
      </Link>
    </div>
  );
}

export function Header() {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { data: categories } = useCategories();

  // Group categories into logical sections based on actual database categories
  const categoryGroups = [
    {
      name: 'Business Essentials',
      slugs: ['business-cards', 'letter-heads', 'branded-envelopes', 'continuation-sheets', 'branded-notepads-jotters', 'folders', 'stationeries'],
    },
    {
      name: 'Marketing Materials',
      slugs: ['flyers-handbills', 'marketing-brochures', 'posters', 'banners-large-format', 'sticker'],
    },
    {
      name: 'Corporate Branding',
      slugs: ['branded-cufflinks', 'branded-nylon-bags', 'branded-paper-bags', 'caps-and-hats', 'custom-tshirts', 'customised-lanyards', 'tote-bags', 'woven-tags'],
    },
    {
      name: 'Events & Celebrations',
      slugs: ['wedding-stationery', 'greeting-cards', 'calendars', 'badges-and-medals'],
    },
    {
      name: 'Office & Professional',
      slugs: ['plastic-id-card', 'corporate-gifts-souvenirs', 'frames-wall-arts'],
    },
    {
      name: 'Custom Printing',
      slugs: ['custom-tshirts'],
    },
    {
      name: 'Packaging & Labels',
      slugs: ['sticker', 'woven-tags', 'branded-paper-bags', 'tote-bags'],
    },
    {
      name: 'Large Format',
      slugs: ['banners-large-format', 'posters', 'frames-wall-arts'],
    },
  ];

  // Get categories that match the slugs in each group
  const getGroupCategories = (slugs: string[]) => {
    if (!categories) return [];
    return categories.filter((cat) => slugs.includes(cat.slug));
  };

  // Only fetch user if token exists
  const hasToken = !!getAuthToken();
  const { data: user } = useUser();
  const isAuthenticated = hasToken && !!user;

  // Fetch products for search
  const { data: productsData } = useProducts();

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Map and filter products based on search query
  const searchResults: Product[] = useMemo(() => {
    if (!debouncedQuery.trim() || !productsData) return [];

    const query = debouncedQuery.toLowerCase();
    return productsData
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description || '').toLowerCase().includes(query) ||
          (product.category || '').toLowerCase().includes(query)
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category || '',
        categorySlug: p.categorySlug || '',
        description: p.description || '',
        shortDescription: p.shortDescription || p.description?.substring(0, 100) || '',
        basePrice: p.basePrice,
        images: getImageUrls(p.images),
        options: [],
        features: p.features || [],
        turnaround: p.turnaround || '3-5 business days',
        minQuantity: p.minQuantity || 1,
      }));
  }, [debouncedQuery, productsData]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleResultClick = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">

      {/* Top bar */}

      <div className="bg-primary text-primary-foreground">
        <div className="container-main">
          <div className="flex items-center justify-between h-9 text-sm">

            <div className="flex items-center gap-4">

              <a href="tel:+2348160360655" className="flex items-center gap-1.5 hover:opacity-80">

                <Phone className="h-3.5 w-3.5" />

                <span>+234 816 036 0655</span>

              </a>

              <AnnouncementBanner className="hidden sm:flex" />

            </div>
            <AnnouncementBanner />
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">Q</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">Quik Print</span>
              <span className="text-xs text-muted-foreground -mt-1">Professional Printing</span>
            </div>
          </Link>

          {/* Desktop Navigation - About, Products, Contact */}
          <nav className="hidden lg:flex items-center">
            <MainNavigation />
          </nav>

          {/* Search - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="input-field pl-10 h-10"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowResults(true)}
              />
              {showResults && (
                <SearchResults
                  results={searchResults}
                  query={debouncedQuery}
                  onResultClick={handleResultClick}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/account" className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user?.firstName}</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:flex">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Product Categories - New Row Under Main Header */}
      <div className="hidden lg:block border-t border-border bg-background">
        <div className="container-main">
          <div className="flex items-center justify-between gap-2 py-2">
            {categoryGroups.map((group: { name: string; slugs: string[] }) => {
              const groupCategories = getGroupCategories(group.slugs);
              if (groupCategories.length === 0) return null;
              
              return (
                <div key={group.name} className="relative group">
                  <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                    {group.name}
                    {/* <svg className="w-3 h-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6m0-6l6 6m0-6" />
                    </svg> */}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-primary mb-2">{group.name}</h4>
                      <div className="space-y-1">
                        {groupCategories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/products/${category.slug}`}
                            className="block py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <div className="container-main py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative" ref={mobileSearchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowResults(true)}
              />
              {showResults && (
                <SearchResults
                  results={searchResults}
                  query={debouncedQuery}
                  onResultClick={handleResultClick}
                />
              )}
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-2">
              <MobileProductsMenu onItemClick={() => setMobileMenuOpen(false)} />
              <Link
                to="/about"
                className="py-2 px-3 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="py-2 px-3 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <hr className="my-2" />
              {isAuthenticated ? (
                <Link
                  to="/account"
                  className="py-2 px-3 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  {user?.firstName}'s Account
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="py-2 px-3 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Login / Register
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
