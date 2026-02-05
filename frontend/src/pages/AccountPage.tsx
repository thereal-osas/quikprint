import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { User, Package, LogOut, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useUser, useOrders, useLogout } from '@/hooks/useApi';
import { toast } from 'sonner';
import { getAuthToken } from '@/services/api';

export default function AccountPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading, error: userError } = useUser();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const logoutMutation = useLogout();

  // Redirect to login if not authenticated, or to admin if user is admin
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // If user query fails with 401, redirect to login
    if (userError) {
      navigate('/login');
      return;
    }

    // Redirect admin users to admin dashboard
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, userError, navigate]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      // Even if logout API fails, clear local state and redirect
      toast.success('Signed out successfully');
      navigate('/login');
    }
  };

  // Show loading state
  if (userLoading) {
    return (
      <Layout>
        <div className="container-main section-padding">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  // If no user data, don't render (will redirect)
  if (!user) {
    return null;
  }

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <Layout>
      <div className="container-main section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link
                  to="/account"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  to="/account/orders"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted"
                >
                  <Package className="h-4 w-4" />
                  Orders
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 w-full"
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                Edit Profile
              </Button>
            </div>

            {/* Recent orders */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Orders
                </h2>
                <Link to="/account/orders">
                  <Button variant="link" className="text-primary">
                    View All
                  </Button>
                </Link>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Link to="/products">
                    <Button variant="outline" className="mt-4">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <OrderStatusBadge status={order.status} />
                        <span className="font-semibold text-primary">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
