export interface ProductOption {
  id: string;
  name: string;
  type: 'select' | 'radio' | 'checkbox' | 'quantity' | 'dimension';
  options?: {
    value: string;
    label: string;
    priceModifier?: number;
  }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  images: string[];
  options: ProductOption[];
  features: string[];
  turnaround: string;
  minQuantity: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  configuration: Record<string, string | number | boolean>;
  totalPrice: number;
  uploadedFile?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'printing' | 'shipped' | 'delivered';
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}
