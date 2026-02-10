import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Phone, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useState, useRef, useEffect } from 'react';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/currency';
import { useDebounce } from '@/hooks/useDebounce';
import { products } from '@/data/mockData';
import { SearchResults } from '@/components/search/SearchResults';
import { useUser } from '@/hooks/useApi';
import { getAuthToken } from '@/services/api';

export function Header() {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Only fetch user if token exists
  const hasToken = !!getAuthToken();
  const { data: user } = useUser();
  const isAuthenticated = hasToken && !!user;

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Filter products based on search query
  const searchResults = debouncedQuery.trim()
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [];

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = () => {
    setSearchQuery('');
    setShowResults(false);
    setMobileMenuOpen(false);
  };

  const navigation = [
    { name: 'About', href: '/about' },
    { name: 'Products', href: '/products' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container-main">
          <div className="flex items-center justify-between h-9 text-sm">
            <div className="flex items-center gap-4">
              <a href="tel:+234-816-036-0655" className="flex items-center gap-1.5 hover:opacity-80">
                <Phone className="h-3.5 w-3.5" />
                <span>+234 816 036 0655</span>
              </a>
              <span className="hidden sm:inline">Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="hover:opacity-80">Help</Link>
              <Link to="/account/orders" className="hover:opacity-80">Track Order</Link>
            </div>
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
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
            
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="py-2 px-3 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
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
