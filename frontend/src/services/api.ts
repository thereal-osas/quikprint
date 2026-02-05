/**
 * API Client for QuikPrint Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get the stored auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Set the auth token in storage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Remove the auth token from storage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

/**
 * API Response wrapper from backend
 */
interface APIResponseWrapper<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make an API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseData = await response.json().catch(() => null) as APIResponseWrapper<T> | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      responseData?.error || responseData?.message || 'An error occurred',
      responseData
    );
  }

  // Backend wraps responses in { success, data } format
  // Extract the actual data from the wrapper
  if (responseData && 'data' in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}

// ==================== AUTH API ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<AuthResponse['user']>('/auth/me'),

  logout: () => {
    removeAuthToken();
    return Promise.resolve();
  },
};

// ==================== PRODUCTS API ====================

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category_id: string;
  category_name: string;
  images: string[];
  options: unknown[];
  is_active: boolean;
  created_at: string;
}

export const productsApi = {
  getAll: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    return request<ProductResponse[]>(`/products${queryString ? `?${queryString}` : ''}`);
  },

  getBySlug: (slug: string) =>
    request<ProductResponse>(`/products/${slug}`),
};

// ==================== CATEGORIES API ====================

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

export const categoriesApi = {
  getAll: () => request<CategoryResponse[]>('/categories'),
  getBySlug: (slug: string) => request<CategoryResponse>(`/categories/${slug}`),
};

// ==================== CART API ====================

export interface CartItemResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  selected_options: Record<string, string>;
  unit_price: number;
  total_price: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  total: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
  selected_options: Record<string, string>;
}

export const cartApi = {
  get: () => request<CartResponse>('/cart'),

  addItem: (data: AddToCartRequest) =>
    request<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (itemId: string, quantity: number) =>
    request<CartResponse>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (itemId: string) =>
    request<CartResponse>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  clear: () =>
    request<void>('/cart', {
      method: 'DELETE',
    }),
};

// ==================== ORDERS API ====================

export interface OrderItemResponse {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options: Record<string, string>;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  status: string;
  items: OrderItemResponse[];
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  created_at: string;
}

export interface CreateOrderRequest {
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment_method: string;
}

export const ordersApi = {
  getAll: () => request<OrderResponse[]>('/orders'),

  getById: (id: string) => request<OrderResponse>(`/orders/${id}`),

  create: (data: CreateOrderRequest) =>
    request<{ order: OrderResponse; payment_url?: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== PRICING API ====================

export interface PricingRequest {
  product_id: string;
  quantity: number;
  selected_options: Record<string, string>;
}

export interface PricingResponse {
  base_price: number;
  options_total: number;
  quantity_discount: number;
  subtotal: number;
  unit_price: number;
  total: number;
}

export const pricingApi = {
  calculate: (data: PricingRequest) =>
    request<PricingResponse>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== PAYMENTS API ====================

export interface InitializePaymentRequest {
  order_id: string;
  callback_url: string;
}

export interface PaymentResponse {
  authorization_url: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
}

export const paymentsApi = {
  initialize: (data: InitializePaymentRequest) =>
    request<PaymentResponse>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verify: (reference: string) =>
    request<VerifyPaymentResponse>(`/payments/verify/${reference}`),
};

// ==================== FILE UPLOAD API ====================

export interface FileUploadResponse {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
}

export const filesApi = {
  upload: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.error || 'File upload failed',
        data
      );
    }

    // Handle wrapped response
    if (data && 'data' in data) {
      return data.data as FileUploadResponse;
    }
    return data as FileUploadResponse;
  },
};

// ==================== ADMIN API ====================

export interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  ordersByStatus: { status: string; orderCount: number; totalAmount: number }[];
}

export interface DailySalesReport {
  date: string;
  orderCount: number;
  totalSales: number;
}

export interface WeeklySalesReport {
  weekStart: string;
  weekEnd: string;
  orderCount: number;
  totalSales: number;
}

export interface OrdersByStatusReport {
  status: string;
  orderCount: number;
  totalAmount: number;
}

export interface CustomerResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export interface AdminOrderResponse extends OrderResponse {
  user_id: string;
  user_email?: string;
  admin_notes?: string;
  status_history?: {
    status: string;
    note?: string;
    changedBy: string;
    changedAt: string;
  }[];
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  images?: string[];
  options?: unknown[];
  features?: string[];
  turnaround?: string;
  minQuantity?: number;
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  categoryId?: string;
  description?: string;
  shortDescription?: string;
  basePrice?: number;
  images?: string[];
  options?: unknown[];
  features?: string[];
  turnaround?: string;
  minQuantity?: number;
}

export interface UpdateOrderStatusRequest {
  status: string;
  note?: string;
}

export const adminApi = {
  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/admin/dashboard'),

  // Reports
  getDailySalesReport: (days?: number) =>
    request<DailySalesReport[]>(`/admin/reports/daily${days ? `?days=${days}` : ''}`),

  getWeeklySalesReport: (weeks?: number) =>
    request<WeeklySalesReport[]>(`/admin/reports/weekly${weeks ? `?weeks=${weeks}` : ''}`),

  getOrdersByStatusReport: () =>
    request<OrdersByStatusReport[]>('/admin/reports/orders-by-status'),

  // Categories
  getCategories: () => request<CategoryResponse[]>('/admin/categories'),

  createCategory: (data: CreateCategoryRequest) =>
    request<CategoryResponse>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: UpdateCategoryRequest) =>
    request<CategoryResponse>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  // Products
  getProducts: () => request<ProductResponse[]>('/admin/products'),

  createProduct: (data: CreateProductRequest) =>
    request<ProductResponse>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: UpdateProductRequest) =>
    request<ProductResponse>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<void>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),

  // Orders
  getOrders: (status?: string) =>
    request<AdminOrderResponse[]>(`/admin/orders${status ? `?status=${status}` : ''}`),

  updateOrderStatus: (id: string, data: UpdateOrderStatusRequest) =>
    request<AdminOrderResponse>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Customers
  getCustomers: () => request<CustomerResponse[]>('/admin/customers'),
};

