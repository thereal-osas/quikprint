/**
 * React Query hooks for API calls
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productsApi,
  categoriesApi,
  cartApi,
  ordersApi,
  pricingApi,
  authApi,
  adminApi,
  announcementApi,
  heroSlideApi,
  twoFactorApi,
  emailApi,
  couponsApi,
  shippingConfigApi,
  type SendTestEmailRequest,
  type BroadcastEmailRequest,
  setAuthToken,
  removeAuthToken,
  getAuthToken,
  type LoginRequest,
  type RegisterRequest,
  type AddToCartRequest,
  type CreateOrderRequest,
  type PricingRequest,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type CreateProductRequest,
  type UpdateProductRequest,
  type UpdateOrderStatusRequest,
  type SetDimensionalPricingRequest,
  type SetPricingTierRequest,
  type CreateAnnouncementRequest,
  type UpdateAnnouncementRequest,
  type CreateHeroSlideRequest,
  type UpdateHeroSlideRequest,
  type BulkUpdatePriceRequest,
  type UpdateUserRoleRequest,
  type VerifyTwoFactorRequest,
  type TwoFactorVerifyRequest,
  type ApplyCouponRequest,
  type CreateCouponRequest,
  type UpdateShippingConfigRequest,
} from '@/services/api';

// ==================== QUERY KEYS ====================

export const queryKeys = {
  products: ['products'] as const,
  product: (slug: string) => ['products', slug] as const,
  categories: ['categories'] as const,
  category: (slug: string) => ['categories', slug] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  user: ['user'] as const,
  // Admin keys
  adminDashboard: ['admin', 'dashboard'] as const,
  adminCategories: ['admin', 'categories'] as const,
  adminProducts: ['admin', 'products'] as const,
  adminOrders: ['admin', 'orders'] as const,
  adminCustomers: ['admin', 'customers'] as const,
  adminDailySales: ['admin', 'reports', 'daily'] as const,
  adminWeeklySales: ['admin', 'reports', 'weekly'] as const,
  adminOrdersByStatus: ['admin', 'reports', 'orders-by-status'] as const,
  adminProductPricing: (productId: string) => ['admin', 'products', productId, 'pricing'] as const,
  // Announcement keys
  announcements: ['announcements'] as const,
  adminAnnouncements: ['admin', 'announcements'] as const,
  // Hero slide keys
  heroSlides: ['heroSlides'] as const,
  adminHeroSlides: ['admin', 'heroSlides'] as const,
};

// ==================== PRODUCTS HOOKS ====================

export function useProducts(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: [...queryKeys.products, params],
    queryFn: () => productsApi.getAll(params),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function usePublicProductPricing(productId: string | undefined) {
  return useQuery({
    queryKey: ['productPricing', productId],
    queryFn: () => pricingApi.getProductPricing(productId!),
    enabled: !!productId,
  });
}

// ==================== CATEGORIES HOOKS ====================

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoriesApi.getAll(),
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.category(slug),
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: !!slug,
  });
}

// ==================== CART HOOKS ====================

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => cartApi.get(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AddToCartRequest) => cartApi.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

// ==================== ORDERS HOOKS ====================

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => ordersApi.getAll(),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

// ==================== PRICING HOOKS ====================

export function useCalculatePrice() {
  return useMutation({
    mutationFn: (data: PricingRequest) => pricingApi.calculate(data),
  });
}

// ==================== AUTH HOOKS ====================

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => authApi.getMe(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!getAuthToken(), // Only run query if token exists
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      // Only set token if 2FA is not required
      if (!response.requiresTwoFA && response.accessToken) {
        setAuthToken(response.accessToken);
        queryClient.setQueryData(queryKeys.user, response.user);
      }
    },
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyTwoFactorRequest) => authApi.verifyTwoFactor(data),
    onSuccess: (response) => {
      if (response.accessToken) {
        setAuthToken(response.accessToken);
        queryClient.setQueryData(queryKeys.user, response.user);
      }
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      setAuthToken(response.accessToken);
      queryClient.setQueryData(queryKeys.user, response.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      removeAuthToken();
      queryClient.setQueryData(queryKeys.user, null);
      queryClient.clear();
    },
  });
}

// ==================== ADMIN HOOKS ====================

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => adminApi.getDashboardStats(),
    enabled: !!getAuthToken(),
  });
}

export function useAdminDailySales(days?: number) {
  return useQuery({
    queryKey: [...queryKeys.adminDailySales, days],
    queryFn: () => adminApi.getDailySalesReport(days),
    enabled: !!getAuthToken(),
  });
}

export function useAdminWeeklySales(weeks?: number) {
  return useQuery({
    queryKey: [...queryKeys.adminWeeklySales, weeks],
    queryFn: () => adminApi.getWeeklySalesReport(weeks),
    enabled: !!getAuthToken(),
  });
}

export function useAdminOrdersByStatus() {
  return useQuery({
    queryKey: queryKeys.adminOrdersByStatus,
    queryFn: () => adminApi.getOrdersByStatusReport(),
    enabled: !!getAuthToken(),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: () => adminApi.getCategories(),
    enabled: !!getAuthToken(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: () => adminApi.getProducts(),
    enabled: !!getAuthToken(),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      adminApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useBulkUpdatePrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdatePriceRequest) => adminApi.bulkUpdatePrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.adminOrders, status],
    queryFn: () => adminApi.getOrders(status),
    enabled: !!getAuthToken(),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusRequest }) =>
      adminApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrdersByStatus });
    },
  });
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: queryKeys.adminCustomers,
    queryFn: () => adminApi.getCustomers(),
    enabled: !!getAuthToken(),
  });
}

// ==================== USER MANAGEMENT HOOKS (RBAC) ====================

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'] as const,
    queryFn: () => adminApi.getUsers(),
    enabled: !!getAuthToken(),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UpdateUserRoleRequest['role'] }) =>
      adminApi.updateUserRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCustomers });
    },
  });
}

// ==================== DIMENSIONAL PRICING HOOKS ====================

export function useProductPricing(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminProductPricing(productId || ''),
    queryFn: () => adminApi.getProductPricing(productId!),
    enabled: !!getAuthToken() && !!productId,
  });
}

export function useSetDimensionalPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: SetDimensionalPricingRequest }) =>
      adminApi.setDimensionalPricing(productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProductPricing(productId) });
    },
  });
}

export function useDeleteDimensionalPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => adminApi.deleteDimensionalPricing(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProductPricing(productId) });
    },
  });
}

// ==================== PRICING TIERS HOOKS ====================

export function useSetPricingTiers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, tiers }: { productId: string; tiers: SetPricingTierRequest[] }) =>
      adminApi.setPricingTiers(productId, tiers),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProductPricing(productId) });
    },
  });
}

export function useDeletePricingTiers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => adminApi.deletePricingTiers(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProductPricing(productId) });
    },
  });
}

// ==================== ANNOUNCEMENT HOOKS ====================

// Public: Get active announcements
export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: announcementApi.getActive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Admin: Get all announcements
export function useAdminAnnouncements() {
  return useQuery({
    queryKey: queryKeys.adminAnnouncements,
    queryFn: announcementApi.getAll,
    enabled: !!getAuthToken(),
  });
}

// Admin: Create announcement
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementRequest) => announcementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
  });
}

// Admin: Update announcement
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementRequest }) =>
      announcementApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
  });
}

// Admin: Delete announcement
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
  });
}

// ==================== HERO SLIDE HOOKS ====================

// Public: Get active hero slides
export function useHeroSlides() {
  return useQuery({
    queryKey: queryKeys.heroSlides,
    queryFn: heroSlideApi.getActive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Admin: Get all hero slides
export function useAdminHeroSlides() {
  return useQuery({
    queryKey: queryKeys.adminHeroSlides,
    queryFn: heroSlideApi.getAll,
    enabled: !!getAuthToken(),
  });
}

// Admin: Create hero slide
export function useCreateHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHeroSlideRequest) => heroSlideApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHeroSlides });
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides });
    },
  });
}

// Admin: Update hero slide
export function useUpdateHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHeroSlideRequest }) =>
      heroSlideApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHeroSlides });
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides });
    },
  });
}

// Admin: Delete hero slide
export function useDeleteHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => heroSlideApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHeroSlides });
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides });
    },
  });
}

// ==================== 2FA HOOKS ====================

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: ['twoFactorStatus'],
    queryFn: () => twoFactorApi.getStatus(),
    enabled: !!getAuthToken(),
  });
}

export function useTwoFactorSetup() {
  return useMutation({
    mutationFn: () => twoFactorApi.setup(),
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TwoFactorVerifyRequest) => twoFactorApi.enable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twoFactorStatus'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TwoFactorVerifyRequest) => twoFactorApi.disable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twoFactorStatus'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

// ==================== EMAIL HOOKS ====================

export function useEmailStatus() {
  return useQuery({
    queryKey: ['emailStatus'],
    queryFn: () => emailApi.getStatus(),
    enabled: !!getAuthToken(),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (data: SendTestEmailRequest) => emailApi.sendTest(data),
  });
}

export function useSendBroadcast() {
  return useMutation({
    mutationFn: (data: BroadcastEmailRequest) => emailApi.sendBroadcast(data),
  });
}

// ==================== COUPON HOOKS ====================

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsApi.getAll(),
    enabled: !!getAuthToken(),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => couponsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & CreateCouponRequest) => 
      couponsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: (data: ApplyCouponRequest) => couponsApi.apply(data),
  });
}

// ==================== SHIPPING CONFIG HOOKS ====================

export function useShippingConfig() {
  return useQuery({
    queryKey: ['shippingConfig'],
    queryFn: () => shippingConfigApi.get(),
    retry: 1, // Only retry once instead of default 3 times
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useShippingConfigAdmin() {
  return useQuery({
    queryKey: ['shippingConfig', 'admin'],
    queryFn: () => shippingConfigApi.getAdmin(),
  });
}

export function useUpdateShippingConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateShippingConfigRequest) => shippingConfigApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingConfig'] });
    },
  });
}
