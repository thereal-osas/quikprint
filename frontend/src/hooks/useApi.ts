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
      setAuthToken(response.accessToken);
      queryClient.setQueryData(queryKeys.user, response.user);
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
