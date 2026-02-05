import { createContext, useContext, useState } from 'react';
import type {ReactNode} from "react"
import type { CartItem, Product } from '@/types/product';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, configuration: Record<string, string | number | boolean>, totalPrice: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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
