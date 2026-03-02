/**
 * API Client for QuikPrint Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
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

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
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

// Login response that may require 2FA
export interface LoginResponse {
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFA: boolean;
  twoFASessionId?: string;
}

// 2FA Types
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
}

export interface VerifyTwoFactorRequest {
  sessionId: string;
  code: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyTwoFactor: (data: VerifyTwoFactorRequest) =>
    request<LoginResponse>('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<UserProfile>('/auth/me'),

  logout: () => {
    removeAuthToken();
    return Promise.resolve();
  },
};

// ==================== 2FA API ====================

export const twoFactorApi = {
  getStatus: () => request<TwoFactorStatusResponse>('/auth/2fa/status'),

  setup: () => request<TwoFactorSetupResponse>('/auth/2fa/setup', {
    method: 'POST',
  }),

  enable: (data: TwoFactorVerifyRequest) =>
    request<{ message: string }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  disable: (data: TwoFactorVerifyRequest) =>
    request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== PRODUCTS API ====================

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  categoryId: string;
  category: string;
  categorySlug: string;
  images: string[];
  options: unknown[];
  features: string[];
  turnaround: string;
  minQuantity: number;
  pricingTiers?: PricingTier[];
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  id: string;
  productId: string;
  minQty: number;
  maxQty?: number;
  price: number;
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
  image: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
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
  file_url?: string;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  status: string;
  items: OrderItemResponse[];
  subtotal: number;
  shipping_cost: number;
  shipping_fee?: number;
  tax: number;
  vat?: number;
  total: number;
  shipping_address: string | {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  created_at?: string;
  createdAt?: string; // Backend returns camelCase
  customer_name?: string;
  customer_email?: string;
  payment_status?: string;
  admin_notes?: string;
}

export interface CreateOrderRequest {
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: CreateOrderItemRequest[];
  discount?: number;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  // Allow arbitrary configuration values (dimensions, options, flags, etc.)
  configuration: Record<string, unknown>;
}

export const ordersApi = {
  getAll: () => request<OrderResponse[]>('/orders'),

  getById: (id: string) => request<OrderResponse>(`/orders/${id}`),

  create: (data: CreateOrderRequest) =>
    request<OrderResponse>('/orders', {
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
  getProductPricing: (productId: string) =>
    request<ProductPricingResponse>(`/pricing/products/${productId}`),
};

// ==================== PAYMENTS API ====================

export interface InitializePaymentRequest {
  orderId: string;
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
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
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
  totalOrders?: number;
  totalSpent?: number;
}

export type UserRole = 'customer' | 'manager' | 'admin';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
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
  adminNotes?: string;
}

export interface BulkUpdatePriceRequest {
  productIds: string[];
  updateType: 'set' | 'increase' | 'decrease' | 'percentage';
  value: number;
}

export interface BulkUpdatePriceResponse {
  updatedCount: number;
  failedCount: number;
  failedIds?: string[];
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

  // Bulk Operations
  bulkUpdatePrice: (data: BulkUpdatePriceRequest) =>
    request<BulkUpdatePriceResponse>('/admin/products/bulk-update-price', {
      method: 'POST',
      body: JSON.stringify(data),
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

  // User Management (RBAC)
  getUsers: () => request<UserResponse[]>('/admin/users'),

  updateUserRole: (userId: string, data: UpdateUserRoleRequest) =>
    request<UserResponse>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Product Pricing
  getProductPricing: (productId: string) =>
    request<ProductPricingResponse>(`/admin/products/${productId}/pricing`),

  setDimensionalPricing: (productId: string, data: SetDimensionalPricingRequest) =>
    request<DimensionalPricingResponse>(`/admin/products/${productId}/dimensional-pricing`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteDimensionalPricing: (productId: string) =>
    request<void>(`/admin/products/${productId}/dimensional-pricing`, {
      method: 'DELETE',
    }),

  // Pricing Tiers (Quantity-based pricing)
  setPricingTiers: (productId: string, tiers: SetPricingTierRequest[]) =>
    request<PricingTierResponse[]>(`/admin/products/${productId}/pricing-tiers`, {
      method: 'POST',
      body: JSON.stringify(tiers),
    }),

  deletePricingTiers: (productId: string) =>
    request<void>(`/admin/products/${productId}/pricing-tiers`, {
      method: 'DELETE',
    }),
};

// ==================== DIMENSIONAL PRICING TYPES ====================

export interface DimensionalPricingResponse {
  id: string;
  productId: string;
  ratePerUnit: number;
  unit: string; // "sqft", "sqin", "sqm", "sqcm"
  minCharge: number;
}

export interface SetDimensionalPricingRequest {
  ratePerUnit: number;
  unit: string;
  minCharge: number;
}

export interface ProductPricingResponse {
  tiers: PricingTierResponse[] | null;
  dimensionalPricing: DimensionalPricingResponse | null;
  addOns: AddOnResponse[] | null;
  rules: PricingRuleResponse[] | null;
}

export interface PricingTierResponse {
  id: string;
  productId: string;
  minQty: number;
  maxQty: number;
  price: number;
}

export interface SetPricingTierRequest {
  minQty: number;
  maxQty: number;
  price: number;
}

export interface AddOnResponse {
  id: string;
  productId: string;
  name: string;
  type: string;
  priceModifier: number;
  enabled: boolean;
}

export interface PricingRuleResponse {
  id: string;
  productId: string;
  ruleType: string;
  value: number;
  description: string;
}

// ==================== ANNOUNCEMENT TYPES ====================

export interface AnnouncementResponse {
  id: string;
  text: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  text: string;
  linkUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateAnnouncementRequest {
  text?: string;
  linkUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// ==================== HERO SLIDE TYPES ====================

export interface HeroSlideResponse {
  id: string;
  heading: string;
  subheading?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHeroSlideRequest {
  heading: string;
  subheading?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateHeroSlideRequest {
  heading?: string;
  subheading?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// ==================== ANNOUNCEMENT API ====================

export const announcementApi = {
  // Public: Get active announcements
  getActive: () => request<AnnouncementResponse[]>('/announcements'),

  // Admin: Get all announcements
  getAll: () => request<AnnouncementResponse[]>('/admin/announcements'),

  // Admin: Get single announcement
  getById: (id: string) => request<AnnouncementResponse>(`/admin/announcements/${id}`),

  // Admin: Create announcement
  create: (data: CreateAnnouncementRequest) =>
    request<AnnouncementResponse>('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin: Update announcement
  update: (id: string, data: UpdateAnnouncementRequest) =>
    request<AnnouncementResponse>(`/admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin: Delete announcement
  delete: (id: string) =>
    request<void>(`/admin/announcements/${id}`, { method: 'DELETE' }),
};

// ==================== HERO SLIDE API ====================

export const heroSlideApi = {
  // Public: Get active hero slides
  getActive: () => request<HeroSlideResponse[]>('/hero-slides'),

  // Admin: Get all hero slides
  getAll: () => request<HeroSlideResponse[]>('/admin/hero-slides'),

  // Admin: Get single hero slide
  getById: (id: string) => request<HeroSlideResponse>(`/admin/hero-slides/${id}`),

  // Admin: Create hero slide
  create: (data: CreateHeroSlideRequest) =>
    request<HeroSlideResponse>('/admin/hero-slides', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin: Update hero slide
  update: (id: string, data: UpdateHeroSlideRequest) =>
    request<HeroSlideResponse>(`/admin/hero-slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin: Delete hero slide
  delete: (id: string) =>
    request<void>(`/admin/hero-slides/${id}`, { method: 'DELETE' }),
};

// ==================== EMAIL API ====================

export interface EmailStatusResponse {
  configured: boolean;
}

export interface SendTestEmailRequest {
  email: string;
}

export interface SendTestEmailResponse {
  message: string;
}

export interface BroadcastEmailRequest {
  subject: string;
  content: string;
  recipients?: string[];
  sendToAll?: boolean;
}

export interface BroadcastEmailResponse {
  message: string;
  totalSent: number;
  successCount: number;
  failedCount: number;
  errors?: string[];
}

export const emailApi = {
  // Get email service status
  getStatus: () => request<EmailStatusResponse>('/admin/email/status'),

  // Send test email
  sendTest: (data: SendTestEmailRequest) =>
    request<SendTestEmailResponse>('/admin/email/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Send broadcast email
  sendBroadcast: (data: BroadcastEmailRequest) =>
    request<BroadcastEmailResponse>('/admin/email/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== COUPONS API ====================

export interface CouponResponse {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

export interface ApplyCouponRequest {
  code: string;
  orderAmount: number;
}

export interface CreateCouponRequest {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

export interface CouponResponse {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyCouponRequest {
  code: string;
  orderAmount: number;
}

export interface ApplyCouponResponse {
  coupon: CouponResponse;
  discountAmount: number;
  message: string;
}

export const couponsApi = {
  getAll: () => request<CouponResponse[]>('/admin/coupons'),
  create: (data: CreateCouponRequest) =>
    request<CouponResponse>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: CreateCouponRequest) =>
    request<CouponResponse>(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/admin/coupons/${id}`, {
      method: 'DELETE',
    }),
  apply: (data: ApplyCouponRequest) =>
    request<ApplyCouponResponse>('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== SHIPPING CONFIG API ====================

export interface ShippingConfig {
  id: string;
  shippingFee: number;
  freeShippingThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShippingConfigRequest {
  shippingFee: number;
  freeShippingThreshold: number;
}

export const shippingConfigApi = {
  // Public: Get shipping config
  get: () => request<ShippingConfig>('/shipping-config'),

  // Admin: Get shipping config
  getAdmin: () => request<ShippingConfig>('/admin/shipping-config'),

  // Admin: Update shipping config
  update: (data: UpdateShippingConfigRequest) =>
    request<ShippingConfig>('/admin/shipping-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
