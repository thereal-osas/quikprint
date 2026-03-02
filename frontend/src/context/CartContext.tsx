import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {ReactNode} from "react"
import type { CartItem, Product } from '@/types/product';
import { useUser } from '@/hooks/useApi';

const getCartStorageKey = (userId?: string) => {
  if (userId) {
    return `quikprint-cart-user-${userId}`;
  }
  return 'quikprint-cart-guest';
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, configuration: Record<string, string | number | boolean>, totalPrice: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  applyCoupon: (code: string, discountAmount: number, message: string) => void;
  clearCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: user } = useUser();
  const userId = user?.id;
  const previousUserIdRef = useRef<string | undefined>(userId);
  
  // Initialize cart from localStorage with user-specific key
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const storageKey = getCartStorageKey(userId);
      const storedCart = localStorage.getItem(storageKey);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  });

  // Discount state - starts empty, only applied when user explicitly enters coupon code
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // Load user-specific cart when user changes
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    
    if (userId !== previousUserId) {
      // Save current cart to previous user's storage before switching
      if (items.length > 0 && previousUserId !== undefined) {
        try {
          const oldStorageKey = getCartStorageKey(previousUserId);
          localStorage.setItem(oldStorageKey, JSON.stringify(items));
        } catch (error) {
          console.warn('Failed to save cart to old user storage:', error);
        }
      }
      
      // Load new user's cart
      const storageKey = getCartStorageKey(userId);
      try {
        const storedCart = localStorage.getItem(storageKey);
        const newItems = storedCart ? JSON.parse(storedCart) : [];
        setItems(newItems);
      } catch {
        setItems([]);
      }

      // Reset coupon for new user (no auto-loading)
      // Users must explicitly apply coupons for each order
      setDiscountAmount(0);
      setCouponCode(null);
      
      previousUserIdRef.current = userId;
    }
  }, [userId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      const storageKey = getCartStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  }, [items, userId]);

  // Note: Coupons are NOT persisted to localStorage anymore
  // Users must explicitly apply them for each order

  const addItem = (
    product: Product,
    quantity: number,
    configuration: Record<string, string | number | boolean>,
    totalPrice: number
  ) => {
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product,
      quantity,
      configuration,
      totalPrice,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      const storageKey = getCartStorageKey(userId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear cart from localStorage:', error);
    }
  };

  const applyCoupon = (code: string, discount: number, _message: string) => {
    setCouponCode(code);
    setDiscountAmount(discount);
  };

  const clearCoupon = () => {
    setCouponCode(null);
    setDiscountAmount(0);
  };

  const itemCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discountAmount,
        couponCode,
        applyCoupon,
        clearCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
